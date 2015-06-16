/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
 * Copyright (C) 2014, 2015 Nik Nyby
 *
 * This file is part of GNU LibreJS.
 *
 * GNU LibreJS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * GNU LibreJS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GNU LibreJS.  If not, see <http://www.gnu.org/licenses/>.
 */
var {Cc, Ci, Cu, Cm, Cr} = require("chrome");

const processResponse = require('http_observer/process_response');
const CHARSETS = [
    '866', 'ansi_x3.4-1968', 'arabic', 'ascii', 'asmo-708', 'big5',
    'big5-hkscs', 'chinese', 'cn-big5', 'cp1250', 'cp1251', 'cp1252',
    'cp1253', 'cp1254', 'cp1255', 'cp1256', 'cp1257', 'cp1258',
    'cp819', 'cp866', 'csbig5', 'cseuckr', 'cseucpkdfmtjapanese',
    'csgb2312', 'csibm866', 'csiso2022jp', 'csiso2022kr', 'csiso58gb231280',
    'csiso88596e', 'csiso88596i', 'csiso88598e', 'csiso88598i', 'csisolatin1',
    'csisolatin2', 'csisolatin3', 'csisolatin4', 'csisolatin5', 'csisolatin6',
    'csisolatin9', 'csisolatinarabic', 'csisolatincyrillic',
    'csisolatingreek', 'csisolatinhebrew', 'cskoi8r', 'csksc56011987',
    'csmacintosh', 'csshiftjis', 'cyrillic', 'dos-874', 'ecma-114',
    'ecma-118', 'elot_928', 'euc-jp', 'euc-kr', 'gb18030', 'gb2312',
    'gb_2312', 'gb_2312-80', 'gbk', 'greek', 'greek8', 'hebrew',
    'hz-gb-2312', 'ibm819', 'ibm866', 'iso-2022-cn', 'iso-2022-cn-ext',
    'iso-2022-jp', 'iso-2022-kr', 'iso88591', 'iso_8859-1', 'iso-8859-1',
    'iso8859-1', 'iso885910', 'iso-8859-10', 'iso8859-10', 'iso885911',
    'iso-8859-11', 'iso8859-11', 'iso_8859-1:1987', 'iso885913', 'iso-8859-13',
    'iso8859-13', 'iso885914', 'iso-8859-14', 'iso8859-14', 'iso885915',
    'iso-8859-15', 'iso8859-15', 'iso-8859-16', 'iso88592', 'iso_8859-2',
    'iso-8859-2', 'iso8859-2', 'iso_8859-2:1987', 'iso88593', 'iso_8859-3',
    'iso-8859-3', 'iso8859-3', 'iso_8859-3:1988', 'iso88594', 'iso_8859-4',
    'iso-8859-4', 'iso8859-4', 'iso_8859-4:1988', 'iso88595', 'iso_8859-5',
    'iso-8859-5', 'iso_8859-5:1988', 'iso88596', 'iso_8859-6', 'iso-8859-6',
    'iso8859-6', 'iso_8859-6:1987', 'iso-8859-6-e', 'iso-8859-6-i', 'iso88597',
    'iso_8859-7', 'iso-8859-7', 'iso8859-7', 'iso_8859-7:1987', 'iso88598',
    'iso_8859-8', 'iso-8859-8', 'iso8859-8', 'iso_8859-8:1988', 'iso-8859-8-e',
    'iso-8859-8i', 'iso-8859-8-i', 'iso88599', 'iso_8859-9', 'iso-8859-9',
    'iso8859-9', 'iso_8859-9:1989', 'iso-ir-100', 'iso-ir-101', 'iso-ir-109',
    'iso-ir-110', 'iso-ir-126', 'iso-ir-127', 'iso-ir-138', 'iso-ir-144',
    'iso-ir-148', 'iso-ir-149', 'iso-ir-157', 'iso-ir-58', 'koi', 'koi8',
    'koi8_r', 'koi8-r', 'koi8-u', 'korean', 'ksc5601', 'ksc_5601',
    'ks_c_5601-1987', 'ks_c_5601-1989', 'l1', 'l2', 'l3', 'l4', 'l5', 'l6',
    'l9', 'latin1', 'latin2', 'latin3', 'latin4', 'latin5', 'latin6', 'latin9',
    'logical', 'mac', 'macintosh', 'ms_kanji', 'replacement', 'shift_jis',
    'shift-jis', 'sjis', 'sun_eu_greek', 'tis-620', 'unicode-1-1-utf-8',
    'us-ascii', 'utf-16', 'utf-16be', 'utf-16le', 'utf8', 'utf-8', 'visual',
    'windows-1250', 'windows-1251', 'windows-1252', 'windows-1253',
    'windows-1254', 'windows-1255', 'windows-1256', 'windows-1257',
    'windows-1258', 'windows-31j', 'windows-874', 'windows-949', 'x-cp1250',
    'x-cp1251', 'x-cp1252', 'x-cp1253', 'x-cp1254', 'x-cp1255', 'x-cp1256',
    'x-cp1257', 'x-cp1258', 'x-euc-jp', 'x-gbk', 'x-mac-cyrillic',
    'x-mac-roman', 'x-mac-ukrainian', 'x-sjis', 'x-user-defined', 'x-x-big5'
];

var StreamLoader = function() {
    this.loader = null;
    this.listener = null;
    this.originalListener = null;
};

StreamLoader.prototype.setOriginalListener = function(listener) {
    this.originalListener = listener;
};

StreamLoader.prototype.init = function() {
    try {
        var that = this;
        this.listener = new StreamListener();

        this.listener.callback = function (loader, context, status, data) { 
            //console.debug("here is the data", data);
            var responseInfo = {'request': loader.channel,
                'context': context, 
                'statusCode': status,
                'receivedData': data};
            var responseHandler = processResponse.ProcessResponse(that.originalListener, responseInfo);        
            responseHandler.processAllTypes();

            that.destroy();
        };

        this.loader = Cc["@mozilla.org/network/unichar-stream-loader;1"].
            createInstance(Ci.nsIUnicharStreamLoader);

        this.loader.init(this.listener);
    } catch (e) {
        console.debug(e);
    }
};

StreamLoader.prototype.destroy = function () {
    this.loader = null;
    this.listener = null;
};

var getRegexForContentType = function (contentType) {
    if (/xhtml/i.test(contentType)) {
        return /<\?[^>]*?encoding=(?:["']*)([^"'\s\?>]+)(?:["']*)/i;        
    }

    // return the regular html regexp for anything else.
    return /<meta[^>]*?charset=(?:["']*)([^"'\s>]+)(?:["']*)/i;
};

var StreamListener = function() {};

StreamListener.prototype.QueryInterface = function listener_qi(iid) {
    if (iid.equals(Ci.nsISupports) ||
            iid.equals(Ci.nsIUnicharStreamLoaderObserver)) {
                return this;
            }
    throw Cr.NS_ERROR_NO_INTERFACE;
};

StreamListener.prototype.onStreamComplete = function onStreamComplete(
        loader, context, status, data) {
    this.callback(loader, context, status, data);
};

StreamListener.prototype.onDetermineCharset = function onDetermineCharset(
        loader, context, data) {
    var match, regex;
    if (loader.channel.contentCharset !== undefined &&
        loader.channel.contentCharset !== ""
       ) {
        return loader.channel.contentCharset;
    } else {
        match = getRegexForContentType(loader.channel.contentType).exec(data);
        if (match.length > 0 &&
            CHARSETS.indexOf(match[1].toLowerCase()) >= 0
           ) {
            loader.channel.contentCharset = match[1];
            return match[1];
        } else {
            return "utf-8";
        }
    }
};

exports.streamLoader = function () {
    var l = new StreamLoader();
    l.init();
    return l;
};
