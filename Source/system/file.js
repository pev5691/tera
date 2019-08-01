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
global.TYPE_TRANSACTION_FILE = 5;
global.FORMAT_FILE_CREATE = "{type:byte,Name:str,ContentType:str,Reserve:arr10,Data:tr}";
const WorkStructRun = {};
class FileApp extends require("./dapp")
{
    constructor()
    {
        super()
    }
    OnWriteTransaction(Block, Body, BlockNum, TrNum, ContextFrom)
    {
        return true;
    }
    GetObjectTransaction(Body)
    {
        var TR = BufLib.GetObjectFromBuffer(Body, FORMAT_FILE_CREATE, WorkStructRun);
        return TR;
    }
    GetScriptTransaction(Body)
    {
        var TR = this.GetObjectTransaction(Body);
        ConvertBufferToStr(TR)
        return JSON.stringify(TR, "", 2);
    }
    GetVerifyTransaction(Block, BlockNum, TrNum, Body)
    {
        return 1;
    }
};
module.exports = FileApp;
var App = new FileApp;
DApps["File"] = App;
DAppByType[TYPE_TRANSACTION_FILE] = App;
