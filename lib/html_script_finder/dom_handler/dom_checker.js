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
 * dom_checker.js
 * 
 * checks scripts for nonfree/nontrivial.
 * 
 */

var {Cc, Ci, Cu, Cm, Cr} = require("chrome");
var timer = require("sdk/timers");

var scriptProperties = require("./script_properties");
const scriptTypes = scriptProperties.scriptTypes;
const statusTypes = scriptProperties.statusTypes;
const reasons = scriptProperties.reasons;

// ensure xhr won't create an infinite loop
// with html content.
var urlTester = require("../url_seen_tester").urlSeenTester;
var urlHandler = require("url_handler/url_handler");

var privacyChecker = require("js_checker/privacy_checker").privacyCheck;
var jsChecker = require("js_checker/js_checker");

const types = require("js_checker/constant_types");
var checkTypes = types.checkTypes;
var stripCDATAOpen = /<\!\[CDATA\[/gi;
var stripCDATAClose = /]]>/g;

const getHash = require("script_entries/scripts_cache").scriptsCached.getHash;

var DomChecker = function() {
    // reference to domHandler instance
    // using this object.
    this.d = null;
};

/**
 * init
 * 
 * assign a reference domHandler object
 * to access/updates its properties.
 * 
 */
DomChecker.prototype.init = function(domHandler) {
    "use strict";

    this.d = domHandler;
};

DomChecker.prototype.destroy = function() {
    "use strict";

    this.d = null;
};

/**
 * checkAllInlineScripts
 * 
 * Sends all the inline/onpage scripts as a whole for a check and
 * removes all scripts if nonfree nontrivial is found.
 *
 */
DomChecker.prototype.checkAllInlineScripts = function() {
    "use strict";

    try {
        var i = 0, len, script;

        if (typeof this.d.inlineScripts !== 'undefined' &&
                this.d.inlineScripts.length > 0
        ) {
            script = this.d.inlineScripts.shift();
            console.debug("checking script for page",
                    this.d.pageURL
                    /*, JSON.stringify(script)*/);
            if (this.d.removedAllScripts) {
                // all js has already been removed.
                // stop check.
                console.debug("removed all");
                return;
            }

            if (this.d.inlineJsFree === true) {
                // add entry as accepted.
                try {
                    hash = getHash(script.text);
                    script.tagAsAccepted(this.d.pageURL, reasons.FREE, hash);
                } catch (e) {
                    console.debug(e);
                }
            }

            // even if page is free we need to check for allow trivial.
            if (script.type === scriptTypes.INLINE) {
                console.debug("analyzing script", script);
                this.analyzeJs(script,
                        script.text,
                        this.checkSingleInlineScript.bind(this));
            } else if (script.type === scriptTypes.ATTRIBUTE) {
                console.debug("analyzing inline script", script);
                this.analyzeJs(script,
                        this.concatAttributes(script),
                        this.checkSingleElementAttributes.bind(this));
            }
        } else {
            // no more inline scripts. Switch to external scripts.
            this.readyForExternal();
        }
    } catch (x) {
        console.debug('checkAllInlineScripts error',
                x, x.lineNumber, x.fileName);
        this.readyForExternal();
    }
};

DomChecker.prototype.concatAttributes = function(script) {
    "use strict";
    var i = 0,
        le = script.jsAttributes.length,
        text = "";

    // we concatenate all js in multiple attributes.
    // because it's too much of a hassle to keep track
    // otherwise.
    for (; i < le; i++) {
        text += script.jsAttributes[i].value + '\n';
    }

    return text;
};

/**
 *
 * check a single element with attributes
 */
DomChecker.prototype.checkSingleElementAttributes = function(
        script, loadedScript, checker) {
    "use strict";
    var check, value, 
        i = 0, 
        le = script.jsAttributes.length,
        text = "";

    try {
        check = checker.parseTree.freeTrivialCheck;
        script.tree = checker;
        script.result = check;		
        script.status = statusTypes.CHECKED;
    } catch (e) {
        console.debug('problem checking inline scripts', e, e.lineNumber);
        this.d.removeGivenJs(script);
    }

    this.processInlineCheckResult(script, check, checker);
};

DomChecker.prototype.processInlineCheckResult = function(
        script, check, checker) {
    "use strict";
    console.debug("check.reason is", check.reason, "and type", check.type);
    var hash = checker.hash;

    if (this.d.inlineJsFree === true) {
        console.debug('tagging', script.text, 'as accepted', "with reason", check.reason);
        script.tagAsAccepted(this.d.pageURL, this.d.freeReason + " -- " + check.reason, hash);
    }

    // process the result.
    if (check.type === checkTypes.FREE) {
        // this is free.
        console.debug('tagging', script.text, 'as accepted with reason', check.reason);
        this.d.inlineJsFree = true;
        this.d.freeReason = check.reason;
        // add entry as accepted.
        script.tagAsAccepted(this.d.pageURL, check.reason, hash);
    } else if (check.type === checkTypes.FREE_SINGLE_ITEM) {
        // accept this script.
        console.debug("free single item, ", check.reason);
        script.tagAsAccepted(this.d.pageURL, check.reason, hash);
    } else if (check.type === checkTypes.NONTRIVIAL) {
        console.debug("nontrivial hash is", hash);
        if (this.d.inlineJsFree) {
            // inline is free. So accept.
            console.debug('tagging', script.text, 'as accepted');
            script.tagAsAccepted(
                    this.d.pageURL,
                    this.d.freeReason + ' -- ' + check.reason,
                    hash);
        } else {
            console.debug('tagging', script.text, 'as removed');
            this.d.removeGivenJs(script, check.reason, false, hash);
        }
    } else if (!this.d.inlineJsFree &&
        this.d.loadsHtmlExternalScripts &&
        check.type === checkTypes.TRIVIAL_DEFINES_FUNCTION
    ) {
        // nontrivial, because defines function and loads
        // external scripts
        console.debug('tagging', script.text, 'as removed');
        this.d.removeGivenJs(script, reasons.FUNCTIONS_INLINE, false, hash);
    } else if (!this.d.loadsHtmlExternalScripts &&
            check === checkTypes.TRIVIAL_DEFINES_FUNCTION
    ) {
        console.debug("Tag as accepted doesn't load another external script");
        script.tagAsAccepted(this.d.pageURL, check.reason, hash);
    } else if (check.type === checkTypes.TRIVIAL || 
            check.type === checkTypes.TRIVIAL_DEFINES_FUNCTION ||
            check.type === checkTypes.WHITELISTED
    ) {
        // add entry as accepted.
        console.debug("Trivial accepted");
        script.tagAsAccepted(this.d.pageURL, check.reason, hash);
    } 

    // next inline script, if applicable.
    this.checkAllInlineScripts();
};

DomChecker.prototype.readyForExternal = function() {
    "use strict";

    console.debug('DomChecker.readyForExternal');
    // done with those inline scripts, continue with
    // the rest.
    this.checkExternalScripts();
};

/**
 * check a single inline script. 
 */
DomChecker.prototype.checkSingleInlineScript = function(
        script, loadedScript, checker) {
    "use strict";
    var check, text;

    console.debug('DomChecker.checkSingleInlineScript');

    try {

        check = checker.parseTree.freeTrivialCheck;

        // update status.
        script.tree = checker;
        script.result = check;
        console.debug("script result is", check.type);
        script.status = statusTypes.CHECKED;

    } catch (e) {
        console.debug('problem checking inline scripts', e, e.lineNumber);
        this.d.removeGivenJs(script, '', false, checker.hash);
    }

    this.processInlineCheckResult(script, check, checker);

};

/**
 * checkExternalScripts
 * Loop through series of external scripts,
 * perform xhr to get their data, and check them
 * to see whether they are free/nontrivial
 *
 */
DomChecker.prototype.checkExternalScripts = function() {
    "use strict";

    console.debug('DomChecker.checkExternalScripts');

    var i = 0;
    var len = this.d.externalScripts.length;
    var that = this;

    console.debug("externalScripts length", len);
    if (this.d.removedAllScripts || len === 0) {
        // all js has already been removed.
        // stop check.
        this.wrapUpBeforeLeaving();
        return;
    }

    for (; i < len; i++) {
        this.xhr(
            this.d.externalScripts[i],
            function(script, scriptText) {
                console.debug("In xhr callback for script url:", script.url);
                if (scriptText === false) {
                    that.d.removeGivenJs(script);
                    that.d.scriptHasBeenTested();
                    that.externalCheckIsDone();
                    return;
                }

                console.debug('about to analyzeJS for script:', script.url);
                that.analyzeJs(
                    script,
                    scriptText,
                    that.checkSingleExternalScript.bind(that));
            }
        );
    }
};

DomChecker.prototype.wrapUpBeforeLeaving = function() {
    "use strict";

    console.debug("wrap up before leaving triggered");
    console.debug('wrapping up');
    this.d.callback(this.d.dom);

};

DomChecker.prototype.analyzeJs = function(script, scriptText, callback) {
    "use strict";
    console.debug('DomChecker.analyzeJs for script:', script.url);
    try {
        var checker = jsChecker.jsChecker();
        var url = "";
        if (typeof script.url !== "undefined") {
            url = script.url;
        } else {
            url = this.pageURL;
        }
        checker.searchJs(scriptText, function() {
            console.debug("Analyze JS"/*, JSON.stringify(checker)*/);
            timer.setTimeout(function() {
                callback(script, scriptText, checker);
            }, 0);
        }, url);
    } catch (x) {
        console.debug('error', x, x.lineNumber, x.fileName);
    }
};

/**
 * Check a single external script.
 */
DomChecker.prototype.checkSingleExternalScript = function(
    script, loadedScript, checker
) {
    "use strict";
    var check;

    console.debug('DomChecker.checkSingleExternalScript()');
    try {
        check = checker.parseTree.freeTrivialCheck;

        script.tree = checker;
        script.result = check;
        console.debug('in checkSingleExternalScript, checker.hash is',
                      checker.hash);
        if (script.status != statusTypes.JSWEBLABEL) {
            script.status = statusTypes.CHECKED;		
        } 

        if (check.type === checkTypes.FREE ||
                check.type === checkTypes.FREE_SINGLE_ITEM
        ) {
            // add entry as accepted.
            script.tagAsAccepted(this.d.pageURL, check.reason, checker.hash);
        } 

        else if (check.type === checkTypes.NONTRIVIAL) {
            console.debug("Removing given js", check.reason);
            this.d.removeGivenJs(script, check.reason, false, checker.hash);
        }

        else if (check.type === checkTypes.TRIVIAL ||
                check.type === checkTypes.WHITELISTED
        ) {
            // if it's accepted, allow.
            script.tagAsAccepted(this.d.pageURL, check.reason, checker.hash);
        } else {
            // anything else is nontrivial. Including TRIVIAL_DEFINES_FUNCTION.
            console.debug("checker hash for remove is ", checker.hash);
            this.d.removeGivenJs(
                script, reasons.FUNCTIONS_EXTERNAL, false, checker.hash);
        } 

    } catch (e) {
        console.debug('error in checkExternalScript',
                      e, e.lineNumber, 'for script', script.url);

        this.d.removeAllJs();
        this.destroy();
        return;
    }
    console.debug('script url is', script.url, 'result is', script.result);
    this.d.scriptHasBeenTested();
    this.externalCheckIsDone();
};

DomChecker.prototype.externalCheckIsDone = function() {
    "use strict";
    console.debug('DomChecker.externalCheckIsDone');

    console.debug('scriptsTested is', this.d.scriptsTested);
    console.debug('num external', this.d.numExternalScripts);

    if (this.d.scriptsTested  >= this.d.numExternalScripts) {
        console.debug('wrapping up external');
        this.wrapUpBeforeLeaving();
    } else {
        var scriptsToCheck = this.d.numExternalScripts - this.d.scriptsTested;
        console.debug('Not wrapping up! Waiting to check ' + scriptsToCheck +
                      ' more script(s)');

        if (this.d.externalScripts[0]) {
            console.debug('script 0 is', this.d.externalScripts[0]);
        }
        if (this.d.externalScripts[1]) {
            console.debug('script 1 is', this.d.externalScripts[1]);
        }
    }
};

/**
 * xhr
 * Perform a XMLHttpRequest on the url given.
 * @param url string A URL.
 * @return The response text.
 */
DomChecker.prototype.xhr = function(script, responseCallback) {
    "use strict";

    var regex = /^text\/html/i;	
    var url = script.url;

    try {
        // add url to whitelist.
        urlTester.addUrl(url);

        // request module. Compatible with Https-Everywhere.
        require('html_script_finder/dom_handler/request')
            .request(script, responseCallback).request();
    }  catch (x) {
        console.debug('error', x, x.lineNumber, x.fileName);
        responseCallback(script, false);
    }
};

/**
 * exports.domChecker
 * Instantiate a brand new clone of the domChecker.
 * @param dom obj The given dom for analysis.
 * @param pageURL string the URL for the page.
 * @param callback function callback when all the work has been performed.
 */
exports.domChecker = function(domHandler) {
    "use strict";

    var domChecker = new DomChecker();

    domChecker.init(domHandler);

    return domChecker;
};

exports.xhr = new DomChecker().xhr;
