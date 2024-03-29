/*
 * @project: TERA
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov (Vtools) 2017-2019 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram:  https://t.me/terafoundation
*/

"use strict";
var MIN_POW_CHAINS = 2;
global.COUNT_NODE_PROOF = 6;
if(global.TEST_NETWORK)
{
    MIN_POW_CHAINS = 1;
    global.COUNT_NODE_PROOF = 1;
}
module.exports = class CRest extends require("./db/block-db")
{
    constructor(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
    {
        super(SetKeyPair, RunIP, RunPort, UseRNDHeader, bVirtual)
    }
    CheckSyncRest()
    {
        var BlockNumTime = GetCurrentBlockNumByTime();
        var Delta = BlockNumTime - this.BlockNumDB;
        if(Delta > REST_START_COUNT + DELTA_BLOCK_ACCOUNT_HASH + 500)
        {
            var BlockNumRest = GetCurrentRestNum(REST_START_COUNT + DELTA_BLOCK_ACCOUNT_HASH + 500);
            if(this.BlockNumDB >= this.BlockNumDBMin && this.BlockNumDB <= this.BlockNumDBMin + BLOCK_PROCESSING_LENGTH2)
            {
            }
            else
                if(BlockNumRest > this.BlockNumDB)
                {
                }
                else
                {
                    this.LoadRestContext = undefined
                    return ;
                }
            this.LoadRestContext = {Mode:0, BlockNum:BlockNumRest, BlockNumRest:BlockNumRest, WasDelta:Delta, BlockNumProof:BlockNumRest + DELTA_BLOCK_ACCOUNT_HASH,
                CountProof:COUNT_BLOCKS_FOR_LOAD, StartTimeHistory:Date.now(), MaxTimeOut:600 * 1000, LoopSyncRest:1, SendGetHeaderCount:0,
                ReceiveHeaderCount:0, ArrProof:[], MapSend:{}}
            for(var i = 0; i < this.NodesArr.length; i++)
            {
                this.NodesArr[i].SendRestGetHeader = 0
            }
            ToLog("**********START REST MODE: " + this.LoadRestContext.BlockNumProof)
        }
        else
        {
            this.LoadRestContext = undefined
        }
    }
    LoopSyncRest()
    {
        let Context = this.LoadRestContext;
        switch(Context.Mode)
        {
            case 0:
                if(!global.TX_PROCESS)
                {
                    return ;
                }
                var ArrNodes = this.GetActualNodes();
                for(var i = 0; i < ArrNodes.length; i++)
                {
                    var Node = ArrNodes[i];
                    if(!Node || Node.SendRestGetHeader)
                    {
                        continue;
                    }
                    Node.SendRestGetHeader = 1
                    ToLog("Send rest get header " + Context.BlockNumProof + " to " + NodeName(Node), 2)
                    this.SendF(Node, {"Method":"GETBLOCKHEADER", "Data":{Foward:1, BlockNum:Context.BlockNumProof, Hash:[]}, "Context":{F:this.RETBLOCKHEADER_REST.bind(this)},
                    })
                    Context.SendGetHeaderCount++
                    break;
                }
                if(Context.ReceiveHeaderCount >= COUNT_NODE_PROOF)
                {
                    Context.Mode = 2
                    ToLog("Next mode: " + Context.Mode + "  Receive:" + Context.ReceiveHeaderCount + "/" + Context.SendGetHeaderCount, 2)
                }
                break;
            case 1000:
                break;
            case 2:
                var MapSumPower = {};
                for(var i = 0; i < Context.ArrProof.length; i++)
                {
                    var Item = Context.ArrProof[i];
                    if(!MapSumPower[Item.SumPower])
                        MapSumPower[Item.SumPower] = 0
                    MapSumPower[Item.SumPower]++
                }
                var MaxCount = 0, MaxPow = 0;
                for(var key in MapSumPower)
                {
                    if(MapSumPower[key] >= MaxCount)
                    {
                        MaxCount = MapSumPower[key]
                        MaxPow = parseInt(key)
                    }
                }
                if(MaxCount < MIN_POW_CHAINS || MaxPow === 0)
                {
                    ToLog("****************************************************************** Error MaxPow=" + MaxPow + " - reload.")
                    this.CheckSyncRest()
                    return ;
                }
                for(var i = 0; i < Context.ArrProof.length; i++)
                {
                    var Item = Context.ArrProof[i];
                    if(Item.SumPower !== MaxPow)
                    {
                        var Str = "BAD SumPower: " + Item.SumPower + "/" + MaxPow;
                        ToLog(Str + " from: " + NodeName(Item.Node), 2)
                    }
                    else
                        if(Item.SumPower && Item.arr.length >= Context.CountProof)
                        {
                            Item.OK = 1
                            Context.BlockProof = Item.arr[0]
                        }
                }
                Context.Mode++
                ToLog("Next mode: " + Context.Mode + "  SumPower:" + MaxPow, 2)
                break;
            case 3:
                if(global.TX_PROCESS && global.TX_PROCESS.RunRPC)
                {
                    Context.Mode++
                    ToLog("Next mode: " + Context.Mode, 2)
                    var Block = {BlockNum:Context.BlockNumRest};
                    this.BlockNumDB = Block.BlockNum
                    this.BlockNumDBMin = Block.BlockNum
                    this.WriteBlockHeaderDB(Block)
                    this.UseTruncateBlockDB = undefined
                    ToLog("Start run TXPrepareLoadRest", 2)
                    global.TX_PROCESS.RunRPC("TXPrepareLoadRest", Block.BlockNum, function (Err,Params)
                    {
                        Context.Mode++
                        ToLog("Next mode: " + Context.Mode, 2)
                    })
                }
                break;
            case 4:
                break;
            case 5:
                let BlockProof = Context.BlockProof;
                var SendCount = 0;
                if(BlockProof)
                    for(var i = 0; i < Context.ArrProof.length; i++)
                    {
                        let Item = Context.ArrProof[i];
                        if(Item.OK)
                        {
                            SendCount++
                            ToLog("Send rest get block proof:" + BlockProof.BlockNum + " to " + NodeName(Item.Node), 2)
                            this.SendF(Item.Node, {"Method":"GETBLOCK", "Data":{BlockNum:BlockProof.BlockNum, TreeHash:BlockProof.TreeHash}, "Context":{F:function (Info)
                                    {
                                        if(Context.TxProof)
                                            return ;
                                        var Data = BufLib.GetObjectFromBuffer(Info.Data, FORMAT_BLOCK_TRANSFER, WRK_BLOCK_TRANSFER);
                                        Info.Data = undefined
                                        if(Data.BlockNum !== BlockProof.BlockNum || CompareArr(Data.TreeHash, BlockProof.TreeHash) !== 0)
                                        {
                                            ToLog("Error get proof block from " + NodeName(Item.Node), 2)
                                            return ;
                                        }
                                        var TreeHash = CalcTreeHashFromArrBody(Data.BlockNum, Data.arrContent);
                                        if(CompareArr(BlockProof.TreeHash, TreeHash) !== 0)
                                        {
                                            ToLog("Error TreeHash in proof block from " + NodeName(Item.Node), 2)
                                            return ;
                                        }
                                        ToLog("GET BLOCK proof from " + NodeName(Item.Node), 2)
                                        var FindTx = undefined;
                                        for(var n = 0; n < Data.arrContent.length; n++)
                                        {
                                            var Body = Data.arrContent[n];
                                            if(Body[0] === TYPE_TRANSACTION_ACC_HASH)
                                            {
                                                try
                                                {
                                                    FindTx = BufLib.GetObjectFromBuffer(Body, FORMAT_ACCOUNT_HASH3, {})
                                                }
                                                catch(e)
                                                {
                                                    ToLog("Error parsing Body[" + n + "] block proof: " + e, 2)
                                                    continue;
                                                }
                                                break;
                                            }
                                        }
                                        if(!FindTx)
                                            return ;
                                        Context.TxProof = FindTx
                                        Context.Mode++
                                        ToLog("Next mode: " + Context.Mode, 2)
                                        Context.AccTaskList = []
                                        Context.AccTaskFinished = 0
                                        var AccCount = FindTx.AccountMax + 1;
                                        for(var n = 0; n < AccCount; n += MAX_ACCOUNTS_TRANSFER)
                                        {
                                            var Task = {StartNum:n, Count:MAX_ACCOUNTS_TRANSFER, Time:0, MapSend:{}};
                                            if(Task.StartNum + Task.Count > AccCount)
                                                Task.Count = AccCount - Task.StartNum
                                            Context.AccTaskList.push(Task)
                                        }
                                        Context.SmartTaskList = []
                                        Context.SmartTaskFinished = 0
                                        for(var n = 0; n < FindTx.SmartCount; n += MAX_SMARTS_TRANSFER)
                                        {
                                            var Task = {StartNum:n, Count:MAX_SMARTS_TRANSFER, Time:0, MapSend:{}};
                                            if(Task.StartNum + Task.Count > FindTx.SmartCount)
                                                Task.Count = FindTx.SmartCount - Task.StartNum
                                            Context.SmartTaskList.push(Task)
                                        }
                                    }}, })
                            if(SendCount >= 5)
                                break;
                        }
                    }
                Context.Mode++
                ToLog("Next mode: " + Context.Mode, 2)
                break;
            case 6:
                break;
            case 7:
                if(Context.AccTaskFinished === Context.AccTaskList.length)
                {
                    Context.Mode++
                    ToLog("Next mode: " + Context.Mode, 2)
                    break;
                }
                var CurTime = Date.now();
                for(var i = 0; i < Context.AccTaskList.length; i++)
                {
                    let Task = Context.AccTaskList[i];
                    var Delta = CurTime - Task.Time;
                    if(Delta > 5 * 1000 && !Task.OK)
                    {
                        var Ret = this.GetNextNode(Task, "", 1);
                        if(Ret.Result)
                        {
                            ToLog("Send GETREST Num:" + Task.StartNum + "-" + Task.Count + " to " + NodeName(Ret.Node), 2)
                            var SELF = this;
                            this.SendF(Ret.Node, {"Method":"GETREST", "Data":{BlockNum:Context.BlockNumRest, AccNum:Task.StartNum, Count:Task.Count, AccHash:Context.TxProof.AccHash},
                                "Context":{F:function (Info)
                                    {
                                        if(Task.OK)
                                            return ;
                                        var Data = SELF.DataFromF(Info);
                                        if(!Data.Result)
                                            return ;
                                        if(Data.Version !== 1)
                                        {
                                            ToLog("ERROR Version Result GETREST Num:" + Task.StartNum + " from " + NodeName(Info.Node), 2)
                                            return ;
                                        }
                                        if(CompareArrL(Data.ProofHash, Context.TxProof.AccHash) !== 0)
                                        {
                                            ToLog("ERROR PROOF HASH Result GETREST Num:" + Task.StartNum + "  Hash: " + GetHexFromArr(Data.ProofHash) + "/" + GetHexFromArr(Context.TxProof.AccHash) + " from " + NodeName(Info.Node),
                                            2)
                                            return ;
                                        }
                                        var ArrM = [];
                                        for(var i = 0; i < Data.Arr.length; i++)
                                        {
                                            ArrM[i] = shaarr(Data.Arr[i])
                                        }
                                        var GetHash = CheckMerkleProof(Data.ProofArrL, ArrM, Data.ProofArrR);
                                        if(CompareArrL(GetHash, Context.TxProof.AccHash) !== 0)
                                        {
                                            ToLog("ERROR CALC PROOF HASH Result GETREST Num:" + Task.StartNum + "  Hash: " + GetHexFromArr(GetHash) + "/" + GetHexFromArr(Context.TxProof.AccHash) + " from " + NodeName(Info.Node),
                                            2)
                                            return ;
                                        }
                                        ToLog("OK Result GETREST Num:" + Task.StartNum + " arr=" + Data.Arr.length + " from " + NodeName(Info.Node), 2)
                                        if(!global.TX_PROCESS || !global.TX_PROCESS.RunRPC)
                                        {
                                            ToLog("ERROR global.TX_PROCESS")
                                            return ;
                                        }
                                        Task.OK = 1
                                        global.TX_PROCESS.RunRPC("TXWriteAccArr", {StartNum:Task.StartNum, Arr:Data.Arr}, function (Err,Params)
                                        {
                                            Context.AccTaskFinished++
                                        })
                                    }}, })
                            Task.Time = CurTime
                            break;
                        }
                    }
                }
                break;
            case 8:
                if(Context.SmartTaskFinished === Context.SmartTaskList.length)
                {
                    Context.Mode++
                    ToLog("Next mode: " + Context.Mode, 2)
                    break;
                }
                var CurTime = Date.now();
                for(var i = 0; i < Context.SmartTaskList.length; i++)
                {
                    let Task = Context.SmartTaskList[i];
                    var Delta = CurTime - Task.Time;
                    if(Delta > 3 * 1000 && !Task.OK)
                    {
                        var Ret = this.GetNextNode(Task, "", 1);
                        if(Ret.Result)
                        {
                            ToLog("Send GETSMART Num:" + Task.StartNum + "-" + Task.Count + " to " + NodeName(Ret.Node), 2)
                            var SELF = this;
                            this.SendF(Ret.Node, {"Method":"GETSMART", "Data":{BlockNum:Context.BlockNumRest, SmartNum:Task.StartNum, Count:Task.Count},
                                "Context":{F:function (Info)
                                    {
                                        if(Task.OK)
                                            return ;
                                        var Data = SELF.DataFromF(Info);
                                        if(!Data.Result)
                                            return ;
                                        ToLog("Result GETSMART Num:" + Task.StartNum + " arr=" + Data.Arr.length + " from " + NodeName(Info.Node), 2)
                                        Task.Node = Info.Node
                                        if(!global.TX_PROCESS || !global.TX_PROCESS.RunRPC)
                                            return ;
                                        Task.OK = 1
                                        global.TX_PROCESS.RunRPC("TXWriteSmartArr", {StartNum:Task.StartNum, Arr:Data.Arr}, function (Err,Params)
                                        {
                                            Context.SmartTaskFinished++
                                        })
                                    }}, })
                            Task.Time = CurTime
                            break;
                        }
                    }
                }
                break;
            case 9:
                if(!global.TX_PROCESS || !global.TX_PROCESS.RunRPC)
                    return ;
                var ErrSmartNum = CheckHashSmarts(Context.TxProof.SmartHash);
                if(ErrSmartNum > 0)
                {
                    var Str = "Error hash in smart num: " + ErrSmartNum;
                    ToLog(Str, 2)
                    var t = Math.trunc(ErrSmartNum / MAX_SMARTS_TRANSFER);
                    var Task = Context.SmartTaskList[t];
                    if(!Task)
                    {
                        ToLog("error task number: " + t)
                        Context.Mode = 100
                    }
                    else
                    {
                        Task.OK = 0
                        Context.Mode--
                        Context.SmartTaskFinished--
                        this.AddToBan(Task.Node, Str)
                    }
                    break;
                }
                var SELF = this;
                global.TX_PROCESS.RunRPC("TXWriteAccHash", {}, function (Err,Params)
                {
                    if(!Params)
                        return ;
                    if(CompareArr(Context.TxProof.AccHash, Params.AccHash) === 0 && CompareArr(Context.TxProof.SmartHash, Params.SmartHash) === 0)
                    {
                        Context.Mode++
                        ToLog("Next mode: " + Context.Mode, 2)
                    }
                    else
                    {
                        ToLog("ERROR RESTS LOAD:")
                        ToLog("Must AccHash:" + GetHexFromArr(Context.TxProof.AccHash))
                        ToLog("Must SmartHash:" + GetHexFromArr(Context.TxProof.SmartHash))
                        ToLog("Write AccHash:" + GetHexFromArr(Params.AccHash))
                        ToLog("Write SmartHash:" + GetHexFromArr(Params.SmartHash))
                        SELF.BlockNumDB = 0
                        SELF.BlockNumDBMin = 0
                        SELF.UseTruncateBlockDB = undefined
                        global.TX_PROCESS.RunRPC("TXPrepareLoadRest", 0, function (Err,Params)
                        {
                        })
                        Context.Mode = 100
                    }
                })
                Context.Mode++
                ToLog("Next mode: " + Context.Mode, 2)
                break;
            case 10:
                break;
            case 11:
                var Context2 = this.LoadHistoryContext;
                Context2.BlockNum = this.LoadRestContext.BlockNumRest
                Context2.StartTimeHistory = Date.now()
                Context.Mode = 200
                break;
            case 200:
                ToLog("Error state!")
                break;
        }
    }
    RETBLOCKHEADER_REST(Info, CurTime)
    {
        if(Info.Node.SendRestGetHeader === 2)
            return ;
        Info.Node.SendRestGetHeader = 2
        var Context = this.LoadRestContext;
        var BufRead = BufLib.GetReadBuffer(Info.Data);
        var arr = this.GetBlockArrFromBuffer_Load(BufRead, Info);
        ToLog("RETBLOCKHEADER_FOWARD SyncRest from " + NodeName(Info.Node) + " arr=" + arr.length, 2)
        Context.ReceiveHeaderCount++
        var MinSumPow = 10 * Context.CountProof;
        var SumPower = 0;
        if(arr.length >= Context.CountProof)
            for(var i = 0; i < Context.CountProof; i++)
            {
                SumPower += arr[i].Power
            }
        if(SumPower <= MinSumPow)
            SumPower = 0
        Context.ArrProof.push({Node:Info.Node, SumPower:SumPower, arr:arr, BufRead:BufRead})
    }
    static
    GETSMART_F()
    {
        return "{\
                SmartNum:uint,\
                Count:uint,\
                }";
    }
    static
    RETSMART_F()
    {
        return global.FORMAT_SMART_TRANSFER;
    }
    static
    GETREST_F()
    {
        return "{\
                BlockNum:uint,\
                AccNum:uint,\
                Count:uint,\
                AccHash:hash,\
            }";
    }
    static
    RETREST_F()
    {
        return global.FORMAT_REST_TRANSFER;
    }
    SendLoadToBegin()
    {
        return ;
        if(!this.BlockNumDBMin)
            return ;
        if(!this.ContextSendLoadToBegin)
            this.ContextSendLoadToBegin = {Time:0, MapSend:{}}
        var Context = this.ContextSendLoadToBegin;
        var CurTime = Date.now();
        var Delta = CurTime - Context.Time;
        if(Delta < 2 * 1000)
            return ;
        var BlockDB = this.ReadBlockHeaderDB(this.BlockNumDBMin + 1);
        if(!BlockDB)
            return ;
        Context.BlockNum = BlockDB.BlockNum
        var Ret = this.GetNextNode(Context, Context.BlockNum, 1);
        if(Ret.Result)
        {
            var Node = Ret.Node;
            ToLog("LOAD_TO_BEGIN - from: " + BlockDB.BlockNum + "  to " + NodeName(Node), 2)
            Context.Time = CurTime
            this.SendF(Node, {"Method":"GETBLOCKHEADER", "Data":{Foward:0, BlockNum:Context.BlockNum, Hash:BlockDB.Hash, IsSum:0, Count:global.COUNT_HISTORY_BLOCKS_FOR_LOAD},
                "Context":{F:function (Info)
                    {
                        ToLog("GET LOAD_TO_BEGIN  from " + NodeName(Info.Node) + " Length=" + Info.Data.length, 2)
                    }}})
        }
    }
};

function CheckHashSmarts(LastSumHash)
{
    DApps.Smart.Close();
    var MaxNum = DApps.Smart.GetMaxNum();
    var Item = DApps.Smart.DBSmart.Read(MaxNum);
    if(CompareArr(Item.SumHash, LastSumHash) !== 0)
        return MaxNum;
    var WorkStruct = {};
    for(var Num = MaxNum; Num >= 1; Num--)
    {
        var PrevItem = DApps.Smart.DBSmart.Read(Num - 1);
        if(!PrevItem)
            return Num;
        var WasSumHash = Item.SumHash;
        Item.SumHash = [];
        var Buf = BufLib.GetBufferFromObject(Item, DApps.Smart.FORMAT_ROW, 20000, WorkStruct);
        var Hash = sha3(Buf);
        var SumHash = sha3arr2(PrevItem.SumHash, Hash);
        if(CompareArr(SumHash, WasSumHash) !== 0)
            return Num;
        Item = PrevItem;
    }
    return 0;
};
