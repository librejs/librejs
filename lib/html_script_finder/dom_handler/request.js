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

var timer = require("sdk/timers");

var {Cc, Ci, Cu, Cm, Cr} = require("chrome");
var {XPCOMUtils} = Cu.import("resource://gre/modules/XPCOMUtils.jsm");


// ensure xhr won't create an infinite loop
// with html content.
var urlTester = require("html_script_finder/url_seen_tester").urlSeenTester;
var urlHandler = require("url_handler/url_handler");
const scriptsCached = require("script_entries/scripts_cache").scriptsCached;

var Request = function() {
    this.url = null;
    this.channel = null;
    this.script = null;
    this.responseCallback = null;
};

/**
 * init
 */
Request.prototype.init = function(script, callback) {
    this.script = script;
    // set initial url
    this.url = this.script.url;

    console.debug('In Request.init() for url:', this.url);

    this.responseCallback = callback;

    var iOService = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);

    this.channel = iOService.newChannel(this.url, null, null);
};

Request.prototype.request = function() {
    var that = this;
    var responseReceived = function (data) {
        that.responseCallback(that.script, data);
    };
    try {
        this.channel.asyncOpen({
            QueryInterface: XPCOMUtils.generateQI(
                                [Ci.nsIRequestObserver, Ci.nsIStreamListener]),
            data: "",
            charset: null,

            onStartRequest: function(request, context) {
                this.charset = request.contentCharset || "UTF-8";
            },

            onDataAvailable: function (request, context, stream, offset, count) {
                try {	 
                    var binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"]
                        .createInstance(Ci.nsIBinaryInputStream);
                    binaryInputStream.setInputStream(stream);
                    var data = binaryInputStream.readBytes(count);
                    this.data += data;
                } catch (x) {
                    console.debug('error in request', x, x.lineNumber);
                    responseReceived("");
                }
            },

            onStopRequest: function (request, context, result) {
                try {
                    if (this.charset.toLowerCase() != "utf-8") {
                        var uConv = Cc["@mozilla.org/intl/utf8converterservice;1"]
                            .createInstance(Ci.nsIUTF8ConverterService);

                        this.data = uConv.convertStringToUTF8(
                            this.data, this.charset, true);
                    }
                } catch (e) {
                    console.debug("Issue with nsIUTF8ConverterService", e);
                    console.debug("Charset was", this.charset);
                    responseReceived("");
                }
                responseReceived(this.data);
            }
        }, null);
    } catch(e) {
        console.debug("asyncOpen exception", e);
        responseReceived("");
    }
};

// Instantiate a Request
exports.request = function(script, callback) {
    var obj = new Request();
    obj.init(script, callback);
    return obj;
};
