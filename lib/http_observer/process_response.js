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

/**
 * This module checks http responses by mime type and returns a
 * modified response.
 */

var {Cc, Ci, Cu, Cm, Cr} = require("chrome");

var jsChecker = require("js_checker/js_checker");

const types = require("js_checker/constant_types");
var checkTypes = types.checkTypes;

// check if scripts embedded dynamically have a jsWebLabel entry indexed by referrer.
var jsWebLabelEntries = require("html_script_finder/web_labels/js_web_labels").jsWebLabelEntries;

var htmlParser = require("html_script_finder/html_parser");

var removedScripts = require("script_entries/removed_scripts").removedScripts;
var allowedRef = require('http_observer/allowed_referrers').allowedReferrers;

var acceptedScripts = require("script_entries/accepted_scripts").acceptedScripts;

// used to display info when a url is whitelisted.
var dryRunScripts = require("script_entries/dryrun_scripts").dryRunScripts;

// node.js url module. Makes it easier to resolve
// urls in that datauri loaded dom
var urlHandler = require("url_handler/url_handler");
var isDryRun = require("addon_management/prefchange").isDryRun;

var jsMimeTypeRe = /.*(javascript|ecmascript).*/i;
var htmlMimeTypeRe = /.*(xhtml\+xml|html|multipart\/x-mixed-replace).*/i;


var processResponseObject = {
    data: null,
    myParser: null,
    url: null,
    scriptFinder: null,
    jsCheckString: null,
    referrer: null,
    contentType: null,
    resInfo: null,
    listener: null,
    req: null,

    /**
     * starts the handling of a new response.
     */
    init: function (listener, resInfo) {
        this.resInfo = resInfo;
        this.req = resInfo.request;
        /* needed for this.req.referrer */
        this.req.QueryInterface(Ci.nsIHttpChannel);
        this.listener = listener;
        this.setData();
        this.setContentType();
        this.setUrls();
    },

    /**
     * Gather the data gathered from onDataAvailable.
     */
    setData: function () {
        this.data = this.resInfo.receivedData;
        //console.debug("\n\nDump of whole data:\n\n", this.data, "\n\n end of dump");
        // Prevents the http response body from being empty,
        // which would throw an error.
        if (this.data == '' || this.data == undefined) {
            this.data = " ";
        }
    },

    /**
     * Set a standardized lowercase mime type.
     */
    setContentType: function() {
        if (this.req.contentType != undefined) {
            this.contentType = String(this.req.contentType).toLowerCase();
        }
    },

    /**
     * setUrls
     * Set the current URL of the response, and
     * set referrer if applicable.
     */
    setUrls: function() {

        if (this.req.URI != undefined) {
            this.fragment = urlHandler.getFragment(this.req.URI.spec);
            console.debug('fragment is', this.fragment);
            this.url = urlHandler.removeFragment(this.req.URI.spec);
        }
        if (this.req.referrer != undefined) {
            this.referrerFragment = urlHandler.getFragment(this.req.referrer.spec);
            this.referrer = urlHandler.removeFragment(this.req.referrer.spec);
        }
    },

    /**
     * processHTML
     * Modifies a string of html
     */
    processHTML: function() {
        var charset = this.req.contentCharset, myParser;

        if (this.req.contentCharset != undefined && this.req.contentCharset != "") {
            charset = this.req.contentCharset;
        } else {
            charset = "";
        }
        acceptedScripts.clearScripts(this.req.URI.spec);
        removedScripts.clearScripts(this.req.URI.spec);
        dryRunScripts.clearScripts(this.req.URI.spec);

        console.debug('charset is', charset);
        console.debug(
            'responseStatus for', this.url, 'is', this.req.responseStatus);

        // send data to htmlParser, and pass on modified data to
        // originalListener.

        myParser = htmlParser.htmlParser().parse(
            this.data,
            charset,
            this.contentType,
            this.url,
            this.fragment,
            this.req.responseStatus,
            this.htmlParseCallback.bind(this));
    },

    /**
     *
     * htmlParseCallback
     *
     * Passed on the callback result to
     * the originalListener.
     *
     */
    htmlParseCallback: function(result) {

        var len = result.length;

        try {

            this.listener.onDataAvailable(
                this.req,
                this.resInfo.context,
                result.newInputStream(0), 0, len);


        } catch (e) {

            this.req.cancel(this.req.NS_BINDING_ABORTED);

        }

        this.listener.onStopRequest(
            this.req,
            this.resInfo.context, this.resInfo.statusCode);

    },

    /**
     * processJS
     * Process and modify a string of JavaScript.
     */
    processJS: function() {
        var checker, check, jsCheckString,
            that = this;
        //var start = Date.now(), end;

        try {
            // make sure script isn't already listed as free
            // in a JS web labels table.
            if (this.checkJsWebLabelsForScript()) {
                // this is free. we are done.
                this.jsListenerCallback();
                return;

            }

            // analyze javascript in response.
            checker = jsChecker.jsChecker();
            check = checker.searchJs(this.data, function () {
                //console.debug("Has been analyzing", that.data);
                that.processJsCallback(checker);
            }, that.url);



        } catch(e) {

            // any error is considered nontrivial.
            console.debug('js error in js app, removing script', e);
            console.debug("error", e, e.lineNumber);
            // modify data that will be sent to the browser.
            this.data = '// LibreJS: Script contents were removed when it was loaded from a page, because another script attempted to load this one dynamically. Please place your cursor in the url bar and press the enter key to see the source.';
            this.jsListenerCallback();
        }

    },

    /**
     * checkJsWebLabelsForScript
     *
     * check whether script that's been received has an entry
     * in a js web labels table (lookup referrer.)
     *
     */
    checkJsWebLabelsForScript: function () {

        console.debug('checking script', this.url);
        console.debug('current list is', JSON.stringify(jsWebLabelEntries));
        if (jsWebLabelEntries[this.referrer] != undefined) {

            var scriptList = jsWebLabelEntries[this.referrer],
                i = 0,
                len = scriptList.length;

            for (; i < len; i++) {

                if (scriptList[i].fileUrl === this.url &&
                    scriptList[i].free === true) {

                    console.debug(this.url, "is free and dynamic!");

                    var scriptObj = {
                        inline: false,
                        url: this.url,
                        contents: this.url,
                        reason: "This script is free (see JS Web Labels page for detail)"
                    };

                    acceptedScripts.addAScript(
                        this.req.referrer.spec, scriptObj, "Script is free");

                    return true;

                }

            }
        }
    },

    processJsCallback: function(checker) {
        try {
            var scriptObj;

            var jsCheckString = checker.parseTree.freeTrivialCheck;
            console.debug("analyzing js callback for", this.url);
            // for testing only.
            //var jsCheckString = {'type': checkTypes.FREE_SINGLE_ITEM };
            console.debug('jscheckstring is', jsCheckString.type);

            if (jsCheckString.type === checkTypes.NONTRIVIAL) {
                if (!allowedRef.urlInAllowedReferrers(this.req.referrer.spec)) {
                    //if (true) {
                    console.debug(
                        "url",
                        this.url,
                        " is found nontrivial",
                        "with reason",
                        jsCheckString.reason);
                    scriptObj = {
                        inline: false,
                        contents: '',
                        removalReason: 'nontrivial',
                        reason: jsCheckString.reason,
                        url: this.url,
                        hash: checker.hash
                    };
                    removedScripts.addAScript(this.req.referrer.spec, scriptObj);

                    // modify data that will be sent to the browser.
                    this.data = '// LibreJS: Script contents were removed when it was loaded from a page, because another script attempted to load this one dynamically and its contents appear to be nonfree/nontrivial. Please hit enter in the location bar to see the actual source.';
                } else {
                    console.debug("writing to dry run", this.url);
                    scriptObj = {
                        inline:false,
                        contents: '',
                        removalReason: 'nontrivial',
                        reason: jsCheckString.reason,
                        url: this.url,
                        hash:checker.hash
                    };
                    dryRunScripts.addAScript(this.req.referrer.spec, scriptObj);
                }

                this.jsListenerCallback();

            } else if (jsCheckString.type === checkTypes.FREE ||
                       jsCheckString.type === checkTypes.FREE_SINGLE_ITEM ||
                       jsCheckString.type === checkTypes.TRIVIAL ||
                       jsCheckString.type === checkTypes.TRIVIAL_DEFINES_FUNCTION ||
                       jsCheckString.type === checkTypes.WHITELISTED) {
                console.debug(
                    "found a free script for",
                    this.url,
                    this.req.referrer.spec,
                    jsCheckString.reason);
                console.debug('found a free script', this.req.referrer.spec);

                scriptObj = {inline: false,
                             contents: '',
                             reason: jsCheckString.reason,
                             url: this.url,
                             hash:checker.hash};

                acceptedScripts.addAScript(this.req.referrer.spec, scriptObj);
                this.jsListenerCallback();
            }

            //var end = Date.now();
            console.debug('exec time', this.url, ' -- ', end - start);
        } catch (x) {
            console.debug('error', x);
        }
    },

    /**
     * ProcessAllTypes
     * Calls processHTML or JS if it finds an appropriate content
     * type.  For everything else it just passes on the data to the
     * original listener.
     */
    processAllTypes: function() {
        // toggle xlibrejs if X-LibreJS is set.

        // process HTML
        if ((htmlMimeTypeRe.test(this.contentType) ||
             this.req.contentType === undefined)) {
            this.processHTML();
            return;
        }

        else {
            // process external JS files that are called from another
            // file (and hence have a referrer).

            if (this.referrer != undefined &&
                jsMimeTypeRe.test(this.contentType) &&
                !(acceptedScripts.isFound(this.referrer, {
                    inline: false, contents: this.url})) &&
                !(acceptedScripts.isFound(this.referrer, {
                    inline:false, contents:this.req.originalURI.spec}))) {

                // console.debug('process js triggered for', this.url);
                this.processJS();

            } else {
                this.jsListenerCallback();
            }

        }

    },

    jsListenerCallback: function () {

        var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
            .createInstance(Ci.nsIScriptableUnicodeConverter);

        if (typeof this.req.contentCharset !== 'undefined' &&
            this.req.contentCharset !== '' &&
            this.req.contentCharset !== null
           ) {
            converter.charset = this.req.contentCharset;
        } else {
            converter.charset = "UTF-8";
        }

        var stream = converter.convertToInputStream(this.data);

        try {
            this.listener.onDataAvailable(
                this.req,
                this.resInfo.context,
                this.storageStream.newInputStream(0),
                0, stream.available());
        } catch (e) {
            this.req.cancel(this.req.NS_BINDING_ABORTED);
        }

        this.listener.onStopRequest(
            this.req,
            this.resInfo.context,
            this.resInfo.statusCode);

    }


};

// creates an instance of processResponseObject.
exports.ProcessResponse = function (listener, resInfo) {
    console.debug('triggered');
    var procResponse = Object.create(processResponseObject);
    procResponse.init(listener, resInfo);
    return procResponse;
};
