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

var observerService = Cc["@mozilla.org/observer-service;1"]
      .getService(Ci.nsIObserverService);

// these are our target mime types for response interception.
var targetMimeTypes = /.*(javascript|ecmascript|html).*/i;
//var targetMimeTypes = /.*(html).*/i;

// ensure xhr won't create an infinite loop
// with html content.
var urlTester = require("html_script_finder/url_seen_tester").urlSeenTester;
var streamLoader = require("http_observer/stream_loader").streamLoader;

var httpRequestObserver = {
    observe: function(request, aTopic, aData) {
        console.debug('atopic is', aTopic);
        var url, newListener, status;

        if (aTopic === "http-on-examine-response" ||
            aTopic === "http-on-examine-cached-response" ||
            aTopic === "http-on-examine-merged-response"
        ) {
            request.QueryInterface(Ci.nsIHttpChannel);

            if (request.URI.scheme !== 'chrome' && 
                (request.responseStatus < 300 || 
                 request.responseStatus > 399) &&
                (targetMimeTypes.test(request.contentType) || 
                 request.contentType === undefined) &&
                (!urlTester.isWhitelisted(request.URI.spec) &&
                 !urlTester.isWhitelisted(request.originalURI.spec))
            ) {
                newListener = new TracingListener();
                request.QueryInterface(Ci.nsITraceableChannel);
                newListener.originalListener = request.setNewListener(newListener);
            } else if (urlTester.isWhitelisted(request.URI.spec) ||
                urlTester.isWhitelisted(request.originalURI.spec)
            ) {
                urlTester.clearUrl(request.URI.spec);
                urlTester.clearUrl(request.originalURI.spec);
            }

        }
    },

    QueryInterface: function (aIID) {
        if (aIID.equals(Ci.nsIObserver) ||
            aIID.equals(Ci.nsISupports)
        ) {
            return this;
        }
        throw Cr.NS_NOINTERFACE;
    }
};

// Copy response listener implementation.
function TracingListener() {
    this.originalListener = null;
    this.streamLoader = streamLoader();
}

TracingListener.prototype = {
    onDataAvailable: function(request, context, inputStream, offset, count) {
        try {
            this.streamLoader.loader.onDataAvailable(
                request, context, inputStream, offset, count);
        } catch (x) {
            console.debug(x, x.lineNumber, x.fileName, "In this case, charset is");
        }
    },

    onStartRequest: function(request, context) {	
        this.streamLoader.setOriginalListener(this.originalListener);
        this.streamLoader.loader.onStartRequest(request, context);     
        this.originalListener.onStartRequest(request, context);
    },

    onStopRequest: function(request, context, statusCode) {
        try {
            this.streamLoader.loader.onStopRequest(request, context, statusCode);
        } catch (e) {
            console.debug('error in onStopRequest', e, e.lineNumber);
        }
    },

    QueryInterface: function (aIID) {
        if (aIID.equals(Ci.nsIStreamListener) ||
            aIID.equals(Ci.nsISupports)
        ) {
            return this;
        }
        throw Cr.NS_NOINTERFACE;
    },
};

exports.startHttpObserver = function() {
    try {
        observerService.addObserver(httpRequestObserver,
                                    "http-on-examine-response", false);
        observerService.addObserver(httpRequestObserver,
                                    "http-on-examine-cached-response", false);
        observerService.addObserver(httpRequestObserver,
                                    "http-on-examine-merged-response", false);
        console.debug('turned on http observer');
    } catch (e) {
        console.debug(e);
    }
};

exports.startHttpObserver();

/* remove observer */
exports.removeHttpObserver = function() {
    try {
        observerService.removeObserver(httpRequestObserver,
                "http-on-examine-response");
        observerService.removeObserver(httpRequestObserver,
                "http-on-examine-cached-response");
        observerService.removeObserver(httpRequestObserver,
                "http-on-examine-merged-response");
        console.debug('turned off http observer');
    } catch (e) {
        console.debug(e);
    }
};
