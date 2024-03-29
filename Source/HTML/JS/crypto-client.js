/*
 * @project: TERA
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2019 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram:  https://t.me/terafoundation
*/

var MAX_SUPER_VALUE_POW = (1 << 30) * 2;
window.TYPE_TRANSACTION_CREATE = 100;

function GetHashWithValues(hash0,value1,value2,bNotCopy)
{
    var hash;
    if(bNotCopy)
        hash = hash0;
    else
        hash = hash0.slice();
    hash[0] = value1 & 0xFF;
    hash[1] = (value1 >>> 8) & 0xFF;
    hash[2] = (value1 >>> 16) & 0xFF;
    hash[3] = (value1 >>> 24) & 0xFF;
    hash[4] = value2 & 0xFF;
    hash[5] = (value2 >>> 8) & 0xFF;
    hash[6] = (value2 >>> 16) & 0xFF;
    hash[7] = (value2 >>> 24) & 0xFF;
    var arrhash = shaarr(hash);
    return arrhash;
};

function GetPowPower(arrhash)
{
    var SumBit = 0;
    for(var i = 0; i < arrhash.length; i++)
    {
        var byte = arrhash[i];
        for(var b = 7; b >= 0; b--)
        {
            if((byte >> b) & 1)
            {
                return SumBit;
            }
            else
            {
                SumBit++;
            }
        }
    }
    return SumBit;
};

function GetPowValue(arrhash)
{
    var value = (arrhash[0] << 23) * 2 + (arrhash[1] << 16) + (arrhash[2] << 8) + arrhash[3];
    value = value * 256 + arrhash[4];
    value = value * 256 + arrhash[5];
    return value;
};

function CreateNoncePOWExtern(arr0,BlockNum,count,startnone)
{
    var arr = [];
    for(var i = 0; i < arr0.length; i++)
        arr[i] = arr0[i];
    if(!startnone)
        startnone = 0;
    var maxnonce = 0;
    var supervalue = MAX_SUPER_VALUE_POW;
    for(var nonce = startnone; nonce <= startnone + count; nonce++)
    {
        var arrhash = GetHashWithValues(arr, nonce, BlockNum, true);
        var value = GetPowValue(arrhash);
        if(value < supervalue)
        {
            maxnonce = nonce;
            supervalue = value;
        }
    }
    return maxnonce;
};
window.TR_TICKET_HASH_LENGTH = 10;

function CreateHashBody(body,Num,Nonce)
{
    var length = body.length - 12;
    body[length + 0] = Num & 0xFF;
    body[length + 1] = (Num >>> 8) & 0xFF;
    body[length + 2] = (Num >>> 16) & 0xFF;
    body[length + 3] = (Num >>> 24) & 0xFF;
    body[length + 4] = 0;
    body[length + 5] = 0;
    length = body.length - 6;
    body[length + 0] = Nonce & 0xFF;
    body[length + 1] = (Nonce >>> 8) & 0xFF;
    body[length + 2] = (Nonce >>> 16) & 0xFF;
    body[length + 3] = (Nonce >>> 24) & 0xFF;
    body[length + 4] = 0;
    body[length + 5] = 0;
    var HASH = sha3(body);
    var FullHashTicket = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for(var i = 0; i < TR_TICKET_HASH_LENGTH; i++)
        FullHashTicket[i] = HASH[i];
    WriteUintToArrOnPos(FullHashTicket, Num, TR_TICKET_HASH_LENGTH);
    return sha3(FullHashTicket);
};
window.DELTA_POWER_POW_TR = 0;
window.DELTA_FOR_TIME_TX = 0;
window.MIN_POWER_POW_TR = 0;
window.CONSENSUS_PERIOD_TIME = 1000;
window.FIRST_TIME_BLOCK = 1530446400000;
window.NEW_SIGN_TIME = 25500000;
window.SetBlockChainConstant = function (Data)
{
    var DeltaServerClient = new Date() - Data.CurTime;
    if(!Data.DELTA_CURRENT_TIME)
        Data.DELTA_CURRENT_TIME = 0;
    window.DELTA_CURRENT_TIME2 = Data.DELTA_CURRENT_TIME - DeltaServerClient;
    window.MIN_POWER_POW_TR = DELTA_POWER_POW_TR + Data.MIN_POWER_POW_TR;
    window.FIRST_TIME_BLOCK = Data.FIRST_TIME_BLOCK;
    window.NEW_SIGN_TIME = Data.NEW_SIGN_TIME;
    window.CONSENSUS_PERIOD_TIME = Data.CONSENSUS_PERIOD_TIME;
    window.GetCurrentBlockNumByTime = function ()
    {
        var CurrentTime = Date.now() + DELTA_CURRENT_TIME2;
        var CurTimeNum = CurrentTime - FIRST_TIME_BLOCK;
        var StartBlockNum = Math.floor((CurTimeNum + CONSENSUS_PERIOD_TIME) / CONSENSUS_PERIOD_TIME);
        return StartBlockNum;
    };
    window.NWMODE = Data.NWMODE;
};
window.GetCurrentBlockNumByTime = function ()
{
    return 0;
};

function SetMinPow()
{
    var item = $("idDeltaPow");
    if(item)
    {
        window.DELTA_POWER_POW_TR = ParseNum(item.value);
    }
};

function GetBlockNumTr(arr)
{
    var BlockNum = window.DELTA_FOR_TIME_TX + GetCurrentBlockNumByTime();
    if(arr[0] === TYPE_TRANSACTION_CREATE)
    {
        var BlockNum2 = Math.floor(BlockNum / 10) * 10;
        if(BlockNum2 < BlockNum)
            BlockNum2 = BlockNum2 + 10;
        BlockNum = BlockNum2;
    }
    return BlockNum;
};
var LastCreatePOWTrType = 0;
var LastCreatePOWBlockNum = 0;
var LastCreatePOWHash = [255, 255, 255, 255];

function CreateHashBodyPOWInnerMinPower(arr,MinPow,startnonce)
{
    SetMinPow();
    var TrType = arr[0];
    var BlockNum = GetBlockNumTr(arr);
    if(MinPow === undefined)
    {
        MinPow = MIN_POWER_POW_TR + Math.log2(arr.length / 128);
    }
    var nonce = startnonce;
    while(1)
    {
        var arrhash = CreateHashBody(arr, BlockNum, nonce);
        var power = GetPowPower(arrhash);
        if(power >= MinPow)
        {
            if(LastCreatePOWBlockNum === BlockNum && LastCreatePOWTrType === TrType && CompareArr(LastCreatePOWHash, arrhash) > 0)
            {
            }
            else
            {
                LastCreatePOWBlockNum = BlockNum;
                LastCreatePOWTrType = TrType;
                LastCreatePOWHash = arrhash;
                return nonce;
            }
        }
        nonce++;
        if(nonce % 2000 === 0)
        {
            BlockNum = GetBlockNumTr(arr);
        }
    }
};

function CalcHashFromArray(ArrHashes,bOriginalSeq)
{
    if(bOriginalSeq === undefined)
        ArrHashes.sort(CompareArr);
    var Buf = [];
    for(var i = 0; i < ArrHashes.length; i++)
    {
        var Value = ArrHashes[i];
        for(var n = 0; n < Value.length; n++)
            Buf.push(Value[n]);
    }
    if(Buf.length === 0)
        return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    else
        if(Buf.length === 32)
            return Buf;
    var Hash = shaarr(Buf);
    return Hash;
};

function GetArrFromValue(Num)
{
    var arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    arr[0] = Num & 0xFF;
    arr[1] = (Num >>> 8) & 0xFF;
    arr[2] = (Num >>> 16) & 0xFF;
    arr[3] = (Num >>> 24) & 0xFF;
    var NumH = Math.floor(Num / 4294967296);
    arr[4] = NumH & 0xFF;
    arr[5] = (NumH >>> 8) & 0xFF;
    return arr;
};

function LoadLib(Path)
{
    var item = document.createElement('script');
    item.type = "text/javascript";
    item.src = Path;
    document.getElementsByTagName('head')[0].appendChild(item);
};

function IsMS()
{
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    if(msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))
    {
        return 1;
    }
    else
    {
        return 0;
    }
};

function LoadSignLib()
{
    if(window.SignLib)
        return ;
    LoadLib("./JS/sign-lib-min.js");
};

function ComputeSecretWithCheck(PubKey,StrPrivKey,F)
{
    if(!window.SignLib)
    {
        SetError("Error - SignLib not installed");
        return ;
    }
    if(!IsHexStr(StrPrivKey) || StrPrivKey.length !== 64)
    {
        SetError("Error set PrivKey");
        return ;
    }
    var PrivKey = Buffer.from(GetArrFromHex(StrPrivKey));
    if(typeof PubKey === "string")
    {
        if(!IsHexStr(PubKey) || PubKey.length !== 66)
        {
            SetError("Error PubKey");
            return ;
        }
        PubKey = Buffer.from(GetArrFromHex(PubKey));
    }
    var Result = SignLib.ecdh(PubKey, PrivKey);
    F(sha3(Result));
};

function ComputeSecret(Account,PubKey,F)
{
    if(GetPrivKey())
    {
        ComputeSecretWithCheck(PubKey, GetPrivKey(), F);
    }
    else
    {
        GetData("GetWalletInfo", {Account:Account}, function (Data)
        {
            if(!Data || !Data.result)
                return ;
            ComputeSecretWithCheck(PubKey, Data.PrivateKey, F);
        });
    }
};

function Encrypt(ArrSecret,StartEncrypt,StrName,StrValue)
{
    var arrRnd = sha3arr2(ArrSecret, sha3(StrName + StartEncrypt));
    var Arr = toUTF8Array(StrValue);
    return DoSecret(Arr, arrRnd);
};

function Decrypt(ArrSecret,StartEncrypt,StrName,Arr)
{
    if(!ArrSecret)
        return "".padEnd(Arr.length / 2, ".");
    if(typeof Arr === "string")
        Arr = GetArrFromHex(Arr);
    var arrRnd = sha3arr2(ArrSecret, sha3(StrName + StartEncrypt));
    var Arr2 = DoSecret(Arr, arrRnd);
    var Str = Utf8ArrayToStr(Arr2);
    return Str;
};

function DoSecret(Arr,arrRnd)
{
    var Arr2 = [];
    var CryptID = 0;
    var Pos = 0;
    while(Pos < Arr.length)
    {
        CryptID++;
        WriteUintToArrOnPos(arrRnd, CryptID, 0);
        var CurBuf = sha3(arrRnd);
        for(var i = 0; i < 32 && Pos < Arr.length; i++, Pos++)
        {
            Arr2[Pos] = Arr[Pos] ^ CurBuf[i];
        }
    }
    return Arr2;
};
var glEncryptInit = 0;

function EncryptInit()
{
    glEncryptInit++;
    var Time = Date.now() - new Date(2019, 0, 1);
    return Math.floor(Time * 100 + Math.random() * 100) * 100 + glEncryptInit;
};

function EncryptID(ArrSecret,StartEncrypt,id)
{
    var Value = $(id).value;
    Value = Value.padEnd(Value.length + random(5), " ");
    return GetHexFromArr(Encrypt(ArrSecret, StartEncrypt, id, Value));
};

function EncryptFields(ArrSecret,Params,ArrName)
{
    if(!Params.Crypto)
        Params.Crypto = EncryptInit();
    for(var i = 0; i < ArrName.length; i++)
    {
        var Name = ArrName[i];
        var Value = Params[Name];
        Value = Value.padEnd(Value.length + random(5), " ");
        Params[Name] = GetHexFromArr(Encrypt(ArrSecret, Params.Crypto, Name, Value));
    }
};

function DecryptFields(ArrSecret,Params,ArrName)
{
    for(var i = 0; i < ArrName.length; i++)
    {
        var Name = ArrName[i];
        if(Params[Name])
        {
            Params[Name] = Decrypt(ArrSecret, Params.Crypto, Name, GetArrFromHex(Params[Name]));
        }
        else
        {
            Params[Name] = "";
        }
    }
};
