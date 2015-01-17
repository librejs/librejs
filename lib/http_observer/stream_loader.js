/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see  <http://www.gnu.org/licenses/>.
 *
 */
var {Cc, Ci, Cu, Cm, Cr} = require("chrome");

const processResponse = require('http_observer/process_response');

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
        if (match) {
            loader.channel.contentCharset = match[1];
            return match[1];
        } else {
            return "UTF-8";
        }
    }
};

exports.streamLoader = function () {
    var l = new StreamLoader();
    l.init();
    return l;
};
