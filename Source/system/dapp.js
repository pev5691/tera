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
const fs = require('fs');
class DApp
{
    constructor()
    {
    }
    Name()
    {
        return "";
    }
    SendMessage(Body, ToAddr)
    {
        SERVER.SendMessage(Body, ToAddr)
    }
    AddTransaction(Tr)
    {
        SERVER.AddTransaction(Tr)
    }
    GetScriptTransaction(Body)
    {
        return "";
    }
    GetVerifyTransaction(Block, BlockNum, TrNum, Body)
    {
        return 1;
    }
    ClearDataBase()
    {
    }
    GetSenderNum(BlockNum, Body)
    {
        return 0;
    }
    OnWriteBlockStart(Block)
    {
    }
    OnWriteBlockFinish(Block)
    {
    }
    OnDeleteBlock(Block)
    {
    }
    OnWriteTransaction(Block, Body, BlockNum, TrNum)
    {
    }
    OnMessage(Msg)
    {
    }
};
module.exports = DApp;

function ReqDir(Path)
{
    if(fs.existsSync(Path))
    {
        var arr = fs.readdirSync(Path);
        for(var i = 0; i < arr.length; i++)
        {
            var name = arr[i];
            ToLog("Reg: " + name);
            var name2 = Path + "/" + arr[i];
            require(name2);
        }
    }
};
global.DApps = {};
global.DAppByType = {};
