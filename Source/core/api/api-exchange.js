/*
 * @project: TERA
 * @version: Development (beta)
 * @license: MIT (not for evil)
 * @copyright: Yuriy Ivanov 2017-2019 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

const crypto = require('crypto');
HTTPCaller.CreateAccount = function (Params,response)
{
    if(typeof Params === "object" && Params.Name && Params.PubKey)
    {
        var TYPE_TRANSACTION_CREATE = 100;
        var TR = {Type:TYPE_TRANSACTION_CREATE, Currency:Params.Currency, PubKey:GetArrFromHex(Params.PubKey), Description:Params.Name,
            Smart:Params.Smart, Adviser:0, };
        var Body = BufLib.GetBufferFromObject(TR, FORMAT_CREATE, 1000, {});
        return {result:1};
    }
    return {result:0};
};
var MaxCountViewRows = global.HTTP_MAX_COUNT_ROWS;
HTTPCaller.GetBalance = function (Params)
{
    if(typeof Params === "object")
    {
        var arr = DApps.Accounts.GetRowsAccounts(ParseNum(Params.AccountID), 1);
        if(arr.length)
        {
            arr[0].result = 1;
            return arr[0];
        }
    }
    return {result:0};
};
HTTPCaller.GenerateKeys = function (Params)
{
    var KeyPair = crypto.createECDH('secp256k1');
    var PrivKey = sha3(crypto.randomBytes(32));
    KeyPair.setPrivateKey(Buffer.from(PrivKey));
    var PubKey = KeyPair.getPublicKey('', 'compressed');
    return {result:1, PrivKey:GetHexFromArr(PrivKey), PubKey:GetHexFromArr(PubKey)};
};
