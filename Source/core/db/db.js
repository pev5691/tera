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
module.exports = class 
{
    constructor()
    {
        this.DBMap = {}
    }
    CheckPathDB()
    {
        var Path = GetDataPath("DB");
        CheckCreateDir(Path)
    }
    CloseDBFile(name, bdelete)
    {
        this.LastHash = undefined
        this.WasUpdate = 1
        var Item = this.DBMap[name];
        if(Item)
        {
            let bDelete = bdelete;
            let Name = name;
            fs.close(Item.fd, function (err)
            {
                if(!err)
                {
                    if(bDelete)
                    {
                        var fname = GetDataPath("DB/" + Name);
                        fs.unlink(fname, function (err)
                        {
                            if(err)
                                ToLog(err)
                        })
                    }
                }
                else
                {
                    ToLog(err)
                }
            })
            delete this.DBMap[name]
        }
    }
    OpenDBFile(name, bWrite, bExist)
    {
        if(bWrite && global.READ_ONLY_DB)
        {
            ToLogTrace("CANNOT WRITE - DB IN READ_ONLY MODE!!!")
            process.exit()
        }
        if(bWrite)
            CheckStartOneProcess(name + "-run")
        this.LastHash = undefined
        this.WasUpdate = 1
        var Item = this.DBMap[name];
        if(Item === undefined)
        {
            if(!this.WasCheckPathDB)
            {
                this.CheckPathDB()
                this.WasCheckPathDB = true
            }
            var fname = GetDataPath("DB/" + name);
            if(!fs.existsSync(fname))
            {
                if(bExist)
                {
                    this.DBMap[name] = null
                    return null;
                }
                var fd = fs.openSync(fname, "w+");
                fs.closeSync(fd)
            }
            var fd = fs.openSync(fname, "r+");
            var stat = fs.statSync(fname);
            var size = stat.size;
            Item = {name:name, fname:fname, fd:fd, size:size, FillRows:0, CountRows:0, }
            this.DBMap[name] = Item
        }
        return Item;
    }
};
var MapCheckProcess = {};
var BlockDB = new module.exports();

function CheckStartOneProcess(Name)
{
    if(global.UpdateMode)
        return ;
    if(global.READ_ONLY_DB || MapCheckProcess[Name])
        return ;
    MapCheckProcess[Name] = 1;
    var path = GetDataPath("DB/" + Name);
    if(fs.existsSync(path))
    {
        fs.unlinkSync(path);
    }
    try
    {
        BlockDB.OpenDBFile(Name);
    }
    catch(e)
    {
        ToLog("****** DETECT START ANOTHER PROCESS for: " + Name);
        ToLogTrace("EXIT");
        process.exit();
    }
};
global.CheckStartOneProcess = CheckStartOneProcess;
