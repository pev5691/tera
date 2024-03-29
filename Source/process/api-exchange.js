/*
 * @project: TERA
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2019 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram:  https://t.me/terafoundation
*/

const crypto = require('crypto');
WebApi2.GenerateKeys = function (Params)
{
    var KeyPair = crypto.createECDH('secp256k1');
    var PrivKey = sha3(crypto.randomBytes(32));
    KeyPair.setPrivateKey(Buffer.from(PrivKey));
    var PubKey = KeyPair.getPublicKey('', 'compressed');
    return {result:1, PrivKey:GetHexFromArr(PrivKey), PubKey:GetHexFromArr(PubKey), Meta:Params ? Params.Meta : undefined};
};
WebApi2.CreateAccount = function (Params,response)
{
    if(typeof Params === "object" && Params.Name && Params.PrivKey)
    {
        var KeyPair = crypto.createECDH('secp256k1');
        KeyPair.setPrivateKey(Buffer.from(GetArrFromHex(Params.PrivKey)));
        var PubKey = KeyPair.getPublicKey('', 'compressed');
        var TR = {Type:TYPE_TRANSACTION_CREATE, Currency:Params.Currency, PubKey:PubKey, Name:Params.Name, Smart:Params.Smart, };
        var Body = BufLib.GetBufferFromObject(TR, FORMAT_CREATE, 1000, {}, 1);
        Body = Body.slice(0, Body.len + 12);
        SendTransaction(Body, TR, Params.Wait, function (result,text)
        {
            var Result = {result:result, text:text, TxID:GetHexFromArr(TR._TxID.slice(0, TR_TICKET_HASH_LENGTH + 6)), BlockNum:TR._BlockNum,
                Meta:Params.Meta, };
            var Str = JSON.stringify(Result);
            response.end(Str);
        });
        return null;
    }
    return {result:0, Meta:Params ? Params.Meta : undefined};
};
var MapSendID = {};
WebApi2.Send = function (Params,response,A,bJsonRet)
{
    if(typeof Params !== "object")
        return {result:0};
    var Coin;
    if(typeof Params.Amount === "number")
        Coin = COIN_FROM_FLOAT(Params.Amount);
    else
        Coin = Params.Amount;
    var FromNum = ParseNum(Params.FromID);
    if(!Coin)
        return {result:0, Meta:Params.Meta, text:"Params.Amount required"};
    if(!FromNum)
        return {result:0, Meta:Params.Meta, text:"Params.FromID required"};
    if(!Params.ToID)
        return {result:0, Meta:Params.Meta, text:"Params.ToID required"};
    var ToPubKeyArr = [];
    var ToID = 0;
    if(typeof Params.ToID === "string" && Params.ToID.length === 66)
        ToPubKeyArr = GetArrFromHex(Params.ToID);
    else
        ToID = ParseNum(Params.ToID);
    var DataFrom = DApps.Accounts.ReadState(FromNum);
    if(!DataFrom)
        return {result:0, Meta:Params.Meta, text:"Error read account: " + FromNum};
    var OperationID;
    if(!MapSendID[FromNum])
    {
        OperationID = DataFrom.Value.OperationID + 10;
        MapSendID[FromNum] = {};
    }
    else
    {
        OperationID = MapSendID[FromNum].OperationID;
        if((new Date() - MapSendID[FromNum].Date) > 8 * 1000)
        {
            OperationID += 20;
        }
    }
    OperationID++;
    MapSendID[FromNum].OperationID = OperationID;
    MapSendID[FromNum].Date = Date.now();
    var TR = {Type:111, Version:3, Reserve:0, FromID:FromNum, OperationID:OperationID, To:[{PubKey:ToPubKeyArr, ID:ToID, SumCOIN:Coin.SumCOIN,
            SumCENT:Coin.SumCENT}], Description:Params.Description, Body:[], };
    if(bJsonRet)
        return {result:1, Tx:TR};
    if(!Params.FromPrivKey)
        return {result:0, Meta:Params.Meta, text:"Params.FromPrivKey required"};
    TR.Sign = DApps.Accounts.GetSignTransferTx(TR, GetArrFromHex(Params.FromPrivKey));
    var Body = BufLib.GetBufferFromObject(TR, FORMAT_MONEY_TRANSFER3, MAX_TRANSACTION_SIZE, {}, 1);
    Body = Body.slice(0, Body.len + 12);
    SendTransaction(Body, TR, Params.Wait, function (result,text)
    {
        var Result = {result:result, text:text, TxID:GetHexFromArr(TR._TxID.slice(0, TR_TICKET_HASH_LENGTH + 6)), BlockNum:TR._BlockNum,
            Meta:Params.Meta, };
        var Str = JSON.stringify(Result);
        response.end(Str);
    });
    return null;
};
WebApi2.GetBalance = function (Params,response)
{
    if(typeof Params === "object")
    {
        var arr = DApps.Accounts.GetRowsAccounts(ParseNum(Params.AccountID), 1);
        if(arr.length)
        {
            var Account = arr[0];
            var Value = Account.Value;
            var Result = {result:1, SumCOIN:Value.SumCOIN, SumCENT:Value.SumCENT, Currency:Account.Currency, PubKey:GetHexFromArr(Account.PubKey),
                Meta:Params.Meta, };
            return Result;
        }
    }
    return {result:0, Meta:Params ? Params.Meta : undefined};
};
WebApi2.GetTransaction = function (Params)
{
    if(typeof Params === "object" && Params.TxID)
    {
        var Arr = GetArrFromHex(Params.TxID);
        var BlockNum = ReadUintFromArr(Arr, TR_TICKET_HASH_LENGTH);
        var Block = SERVER.ReadBlockDB(BlockNum);
        if(Block && Block.arrContent)
        {
            for(var i = 0; i < Block.arrContent.length; i++)
            {
                var Body = Block.arrContent[i];
                var Arr2 = GetTxID(BlockNum, Body);
                if(CompareArr(Arr2, Arr) === 0)
                {
                    return GetTransactionFromBody(Params, Block, i, Body);
                }
            }
        }
    }
    else
    {
        if(typeof Params === "object" && Params.BlockNum && Params.TrNum !== undefined)
        {
            var Block = SERVER.ReadBlockDB(Params.BlockNum);
            if(Block && Block.arrContent)
            {
                var Body = Block.arrContent[Params.TrNum];
                if(Body)
                {
                    return GetTransactionFromBody(Params, Block, Params.TrNum, Body);
                }
            }
        }
    }
    return {result:0, Meta:Params ? Params.Meta : undefined};
};
WebApi2.GetHistoryTransactions = function (Params)
{
    if(typeof Params === "object" && Params.AccountID)
    {
        if(!Params.Count)
            Params.Count = 100;
        if(Params.Confirm === undefined)
            Params.Confirm = 8;
        var arr = DApps.Accounts.GetHistory(Params.AccountID, Params.Count, Params.NextPos, Params.Confirm);
        if(Params.GetTxID || Params.GetDescription)
        {
            for(var i = 0; i < arr.length; i++)
            {
                var Item = arr[i];
                var Block = SERVER.ReadBlockDB(Item.BlockNum);
                if(!Block || (!Block.arrContent))
                    continue;
                var Body = Block.arrContent[Item.TrNum];
                if(!Body)
                    continue;
                if(Params.GetTxID)
                {
                    Item.TxID = GetHexFromArr(GetTxID(Item.BlockNum, Body));
                }
                if(Params.GetDescription)
                {
                    var TR = DApps.Accounts.GetObjectTransaction(Body);
                    if(TR)
                    {
                        Item.Description = TR.Description;
                    }
                }
            }
        }
        var Result = {result:arr.length > 0 ? 1 : 0, History:arr, Tail:DApps.Accounts.DBStateHistory.Read(Params.AccountID), Meta:Params ? Params.Meta : undefined};
        return Result;
    }
    return {result:0, Meta:Params ? Params.Meta : undefined};
};
WebApi2.CreateRawTransaction = function (Params)
{
    if(typeof Params === "object")
    {
        var Ret = WebApi2.Send(Params, undefined, undefined, 1);
        TxArrToHex(Ret.Tx);
        Ret.Meta = Params.Meta;
        return Ret;
    }
    return {result:0, Meta:Params ? Params.Meta : undefined};
};
WebApi2.SignRawTransaction = function (Params)
{
    if(typeof Params === "object" && Params.Tx)
    {
        if(!Params.FromPrivKey)
            return {result:0, Meta:Params.Meta, text:"Params.FromPrivKey required"};
        if(typeof Params.Tx !== "object")
            return {result:0, Meta:Params.Meta, text:"Params.Tx required"};
        if(!Params.Tx.To || !Params.Tx.To.length)
            return {result:0, Meta:Params.Meta, text:"Params.Tx.To required"};
        var TR = Params.Tx;
        TxHexToArr(TR);
        TR.Sign = DApps.Accounts.GetSignTransferTx(TR, GetArrFromHex(Params.FromPrivKey));
        TxArrToHex(TR);
        var Ret = {result:1, Tx:TR, Meta:Params ? Params.Meta : undefined};
        return Ret;
    }
    return {result:0, Meta:Params ? Params.Meta : undefined};
};
WebApi2.SendRawTransaction = function (Params,response)
{
    if(typeof Params === "object" && Params.Tx)
    {
        if(typeof Params.Tx !== "object")
            return {result:0, Meta:Params.Meta, text:"Params.Tx required"};
        if(!Params.Tx.To || !Params.Tx.To.length)
            return {result:0, Meta:Params.Meta, text:"Params.Tx.To required"};
        if(!Params.Tx.Sign)
            return {result:0, Meta:Params.Meta, text:"Params.Tx.Sign required"};
        var TR = Params.Tx;
        TxHexToArr(TR);
        var Body = BufLib.GetBufferFromObject(TR, FORMAT_MONEY_TRANSFER3, MAX_TRANSACTION_SIZE, {}, 1);
        Body = Body.slice(0, Body.len + 12);
        SendTransaction(Body, TR, Params.Wait, function (result,text)
        {
            var Result = {result:result, text:text, TxID:GetHexFromArr(TR._TxID.slice(0, TR_TICKET_HASH_LENGTH + 6)), BlockNum:TR._BlockNum,
                Meta:Params.Meta, };
            var Str = JSON.stringify(Result);
            response.end(Str);
        });
        return null;
    }
    return {result:0, Meta:Params ? Params.Meta : undefined};
};

function TxArrToHex(TR)
{
    if(TR && TR.To && TR.To[0].PubKey)
    {
        if(TR.To[0].PubKey.length)
            TR.To[0].PubKey = GetHexFromArr(TR.To[0].PubKey);
        else
            TR.To[0].PubKey = "";
        if(TR.Sign && TR.Sign.length)
            TR.Sign = GetHexFromArr(TR.Sign);
        else
            TR.Sign = "";
        TR.Body = undefined;
        TR.Reserve = undefined;
    }
};

function TxHexToArr(TR)
{
    TR.Body = [];
    if(TR.Sign && TR.Sign.length)
        TR.Sign = GetArrFromHex(TR.Sign);
    else
        TR.Sign = [];
    for(var i = 0; i < TR.To.length; i++)
    {
        TR.To[i].PubKey = GetArrFromHex(TR.To[i].PubKey);
    }
};
var DELTA_FOR_TIME_TX = 1;

function GetTxID(BlockNum,Body)
{
    var Nonce = ReadUintFromArr(Body, Body.length - 6);
    var Arr2 = CreateTxID(Body, BlockNum, Nonce);
    return Arr2.slice(0, TR_TICKET_HASH_LENGTH + 6);
};

function CreateTxID(body,BlockNum,Nonce)
{
    body.writeUIntLE(BlockNum, body.length - 12, 6);
    body.writeUIntLE(Nonce, body.length - 6, 6);
    var HASH = sha3(body);
    var FullHashTicket = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for(var i = 0; i < TR_TICKET_HASH_LENGTH; i++)
        FullHashTicket[i] = HASH[i];
    WriteUintToArrOnPos(FullHashTicket, BlockNum, TR_TICKET_HASH_LENGTH);
    return FullHashTicket;
};

function GetBlockNumTr(arr)
{
    var BlockNum = DELTA_FOR_TIME_TX + GetCurrentBlockNumByTime();
    if(arr[0] === TYPE_TRANSACTION_CREATE)
    {
        var BlockNum2 = Math.floor(BlockNum / 10) * 10;
        if(BlockNum2 < BlockNum)
            BlockNum2 = BlockNum2 + 10;
        BlockNum = BlockNum2;
    }
    return BlockNum;
};

function CreateHashBodyPOWInnerMinPower(TR,arr,MinPow,startnonce)
{
    var BlockNum = GetBlockNumTr(arr);
    if(MinPow === undefined)
    {
        MinPow = MIN_POWER_POW_TR + Math.log2(arr.length / 128);
    }
    var nonce = startnonce;
    while(1)
    {
        var TxID = CreateTxID(arr, BlockNum, nonce);
        var power = GetPowPower(sha3(TxID));
        if(power >= MinPow)
        {
            TR._TxID = TxID;
            TR._BlockNum = BlockNum;
            ToLog("Find: " + power + " for block:" + BlockNum);
            return nonce;
        }
        nonce++;
        if(nonce % 2000 === 0)
        {
            BlockNum = GetBlockNumTr(arr);
        }
    }
};

function SendTransaction(Body,TR,Wait,F)
{
    if(Body.length > 16000)
    {
        TR._result = 0;
        TR._text = "Error length transaction =" + Body.length + " (max size=16000)";
        F(1, TR, Body);
        return ;
    }
    global.GlobalRunID++;
    let WebID = global.GlobalRunID;
    CreateNonceAndSend(0, 0);
    
function CreateNonceAndSend(startnonce,NumNext)
    {
        if(!NumNext)
            NumNext = 0;
        if(NumNext > 10)
        {
            F(0, TR, Body);
            return ;
        }
        var nonce = CreateHashBodyPOWInnerMinPower(TR, Body, undefined, startnonce);
        process.RunRPC("AddTransactionFromWeb", {WebID:WebID, HexValue:GetHexFromArr(Body)}, function (Err,text)
        {
            TR._result = Err ? 0 : 1;
            TR._text = text;
            if(text === "Not add" || text === "Bad PoW")
            {
                CreateNonceAndSend(nonce + 1, NumNext + 1);
                return ;
            }
            else
                if(text === "Bad time")
                {
                    if(DELTA_FOR_TIME_TX < 6)
                    {
                        DELTA_FOR_TIME_TX++;
                        ToLog("New set Delta time: " + DELTA_FOR_TIME_TX);
                        CreateNonceAndSend(0, NumNext + 1);
                        return ;
                    }
                }
            if(Wait && TR._result)
            {
                global.GlobalRunMap[WebID] = F;
            }
            else
            {
                F(TR._result < 1 ? 0 : 1, text);
            }
        });
    };
};

function GetTransactionFromBody(Params,Block,TrNum,Body)
{
    var TR = DApps.Accounts.GetObjectTransaction(Body);
    if(TR)
    {
        ConvertBufferToStr(TR);
        TR.result = 1;
        TR.Meta = Params.Meta;
        if(Block.VersionBody === 1 && Block.arrContentResult)
        {
            TR.result = Block.arrContentResult[TrNum];
        }
        TR.BlockNum = Block.BlockNum;
        TR.TrNum = TrNum;
        return TR;
    }
    return {result:0, Meta:Params ? Params.Meta : undefined};
};
