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
 *
 * dom_handler.js
 *
 * After the HTML DOM has been parsed, domHandler finds all the scripts
 * on a page (including inline, on-page, and external files), and triggers the
 * JavaScript analysis for each of them.
 *
 */

var {Cc, Ci, Cu, Cm, Cr} = require("chrome");

var scriptProperties =
    require("html_script_finder/dom_handler/script_properties");

const scriptTypes = scriptProperties.scriptTypes;
const statusTypes = scriptProperties.statusTypes;
const reasons = scriptProperties.reasons;

var urlHandler = require("url_handler/url_handler");

var WebLabelFinder =
    require("html_script_finder/web_labels/js_web_labels").WebLabelFinder;

// object model for script entries.
var scriptObject = require("html_script_finder/dom_handler/script_object");

var privacyChecker = require("js_checker/privacy_checker").privacyCheck;
var jsChecker = require("js_checker/js_checker");
const types = require("js_checker/constant_types");

var checkTypes = types.checkTypes;

var stripCDATAOpen = /<\!\[CDATA\[/gi;
var stripCDATAClose = /]]>/g;

var isDryRun = require("addon_management/prefchange").isDryRun;
var allowedRef = require('http_observer/allowed_referrers').allowedReferrers;
var attributeHelpers = require("html_script_finder/dom_handler/attributes");

// javascript:*
var jsInAttrRe = attributeHelpers.jsInAttrRe;

// the list of all available event attributes
var intrinsicEvents = attributeHelpers.intrinsicEvents;

var domGatherer =
    require("html_script_finder/dom_handler/dom_gatherer").domGatherer;
var domChecker  =
    require("html_script_finder/dom_handler/dom_checker").domChecker;

/**
 * The DomHandler object takes a whole document,
 * finds script elements within that DOM, analyzes them
 * using the js_checker module and finally returns a cleaned
 * DOM depending on the result.
 */
var DomHandler = function() {
    // external object with methods used
    // in DomHandler
    this.domGatherer = null;

    // external object with methods used
    // in DomHandler
    this.domChecker = null;

    this.dom = null;
    this.pageURL = null;

    // fragment found in url.
    this.fragment = null;

    // array containing all scripts on a page.
    this.domScripts = [];

    // array containing all scripts on a page,
    // data related to them, such as parse tree, ...
    this.inlineScripts = [];

    this.externalScripts = [];

    // all scripts.
    this.scripts = [];

    // keeps track of the number of scripts.
    this.numScripts = 0;

    // store the reference to the callback method
    // presumably from htmlParser.
    this.callback = function() {};

    // boolean set to true if external scripts are loaded
    // from the html page.
    this.loadsHtmlExternalScripts = false;

    this.jsCheckString = null;

    /* object containing boolean property set to false if trivialness
       is not allowed anymore (if another script defines ajax requests,
       ...)  */
    this.allowTrivial = null;

    // boolean set to true if inline JavaScript
    // is found to be free.
    this.inlineJsFree = null;

    // boolean set to true when at least one script
    // has been removed.
    this.hasRemovedScripts = null;

    // boolean to check if scripts were removed
    // prevents removeAllJs from running multiple times.
    this.removedAllScripts = null;

    // will eventually contain an array of data
    // for the js web labels licenses.
    this.licenseList = [];

    // the response status for the page (200, 404, ...)
    this.responseStatus = null;

    // number of scripts fully tested.
    this.scriptsTested = 0;

    // number of external scripts to be tested.
    this.numExternalScripts = null;

    // number of inline/inattribute scripts
    this.numInlineScripts = null;
};

/**
 * Initialize properties of the object
 *
 * @param {domObject} obj A reference of the DOM object being
 * analyzed.
 *
 * @param {pageURL} string The formatted URL (with fragment
 * removed) of the corresponding page for this DOM
 *
 * @param {fragment} the #fragment from the url if applicable.
 *
 * @param {callback} the callback function.
 *
 */
DomHandler.prototype.init = function(
    domObject, pageURL, fragment, responseStatus, callback
) {
    // initialize object properties.

    console.debug('init', pageURL);
    var that = this;

    this.reset();

    // arguments passed.
    this.dom = domObject;
    this.pageURL = pageURL;
    this.fragment = fragment;
    this.responseStatus = responseStatus;

    console.debug('in dom handler, responseStatus is', this.responseStatus);

    // make callback function available
    // for the entire object.
    this.callback = function (dom) {
        callback(dom);
        that.destroy();
    };
};

DomHandler.prototype.reset = function () {

    this.dom = null;
    // arrays.
    this.onEventElement = [];
    this.scriptStatus = [];
    this.inlineScripts = [];
    this.externalScripts = [];
    this.scripts = [];

    // booleans
    this.allowTrivial = true;
    this.inlineJsFree = false;
    this.hasRemovedScripts = false;
    this.removedAllScripts = false;

    // we start with 0, and will increment in
    // dom_checker.
    this.numExternalScripts = 0;

    this.numInlineScripts = 0;

    this.scriptsTested = 0;

};

DomHandler.prototype.destroy = function () {
    this.domGatherer = null;
    this.domChecker = null;
    /* destroy callback so that it can't be called multiple times. */
    this.callback = function() {};
    //this.reset();
};

DomHandler.prototype.scriptHasBeenTested = function() {
    this.scriptsTested++;
    console.debug('incremented DomHandler.scriptsTested to',
                  this.scriptsTested);
};

/**
 * scriptHasJsWebLabel
 *
 * Checks if a script was found earlier in a Js License Web Label
 * table.  See http://www.gnu.org/licenses/javascript-labels.html
 * for more information.
 *
 */
DomHandler.prototype.scriptHasJsWebLabel = function(script) {
    if (this.licenseList) {

        var url = urlHandler.resolve(this.pageURL, script.src),
            i = 0,
            len = this.licenseList.length;

        console.debug('looking for web label');

        for (; i < len; i++) {
            if (this.licenseList[i].fileUrl === url &&
                this.licenseList[i].free === true
               ) {
                console.debug('found something true');
                console.debug(
                    this.licenseList[i].fileUrl, ' is found');
                return true;
            }
        }
    }
    return false;
};

/**
 * processScripts.
 * Starts by looking for a js web labels page
 * then calls the complete function, which runs
 * the rest of the check.
 */
DomHandler.prototype.processScripts = function () {
    var that = this;

    // check for the existence of the
    // js web labels first.
    this.lookForJsWebLabels(function () {

        // gather and check all script elements on
        // page.
        console.debug("Calling checkAllScripts");
        that.checkAllScripts();

    });

};

/**
 * jsWebLabelsComplete
 *
 */
DomHandler.prototype.checkAllScripts = function () {
    try {
        console.debug(
            'found in', this.pageURL, JSON.stringify(this.licenseList));
        console.debug('checkAllScripts triggered async');

        // use domGatherer to gather scripts.
        this.domGatherer.findScripts();
        this.domGatherer.gatherScriptsContent();
        this.domGatherer.gatherIntrinsicEvents();

        console.debug('fragment is', this.fragment);

        if (
            this.fragment === undefined ||
                this.fragment === null ||
                this.fragment.indexOf('librejs=true') < 0
        ) {
            try {

                // use domChecker to check scripts.
                console.debug("Calling checkAllInlineScripts");
                this.domChecker.checkAllInlineScripts();
            } catch (x) {
                console.debug('error in domChecker:', x, x.lineNumber);
                this.removeAllJs();
            }
        } else {
            console.debug('This is a pageworker, removing all js');
            // this is the Page Worker to find contact link
            // just remove all the JS since we don't need it.
            console.debug('fragment found, remove js');
            this.removeAllJs();
        }
    } catch (x) {
        console.debug('error', x, x.lineNumber, x.fileName);
    }
};

/**
 * lookForJsWebLabels
 *
 * Checks if a link to a js web label table exists.
 * If it does, return an array of objects with the data
 * gathered (script name, path, license name, url, ...)
 *
 */
DomHandler.prototype.lookForJsWebLabels = function (completed) {
    var that = this;
    console.debug("calling lookForJsWebLabels");
    if (this.fragment !== '#librejs=true') {
        var webLabelFinder = new WebLabelFinder();
        webLabelFinder.init(
            this.dom,
            this.pageURL,
            function (licenseList) {
                // assign array returned to property.
                that.licenseList = licenseList;
                console.debug("calling completed");
                completed();
            });
    } else {
        completed();
    }
};

DomHandler.prototype.checkScriptForJsWebLabels = function(script) {
    var scriptEntry;

    if (this.hasSrc(script) && this.scriptHasJsWebLabel(script)) {
        // This script is in the list of allowed scripts (through web labels)
        scriptEntry = scriptObject.Script({
            'type': scriptTypes.EXTERNAL,
            'status': statusTypes.ACCEPTED,
            'element': script,
            'url': urlHandler.resolve(this.pageURL, script.src)
        });

        scriptEntry.tagAsAccepted(this.pageURL, reasons.FREE);
        return true;
    }
};

/**
 * hasSrc
 * Check the given script has an src attribute.
 * @param script obj The script element.
 * @return a string with the value of the src attribute.
 */
DomHandler.prototype.hasSrc = function(script) {
    if (script.src) {
        return script.src;
    }
    return false;
};

/**
 * Uses relationChecker to guess whether the script only uses
 * predefined functions/variables or interacts with other scripts
 * (this is still very experimental and needs improvement.)
 *
 */
DomHandler.prototype.removeScriptIfDependent = function (script) {
    var nonWindowProps = script.tree.relationChecker.nonWindowProperties;

    for (var entry in nonWindowProps) {
        if (nonWindowProps[entry]) {
            console.debug('script has non window properties.');
            this.removeGivenJs(script, reasons.TRIVIAL_NOT_ALLOWED);
            return true;
        }
    }
};

/**
 * removeGivenJs
 * Remove a single script from the DOM.
 * @param script Obj The script element to be removed from the
 * DOM.
 *
 */
DomHandler.prototype.removeGivenJs = function (script, reason, singleton, hash) {
    var commentedOut;
    var isAllowed = allowedRef.urlInAllowedReferrers(this.pageURL);
    console.debug("removing given js hash", hash);

    if (script.status != statusTypes.REJECTED &&
        script.status != statusTypes.JSWEBLABEL
       ) {
        console.debug('removing a', script.type);
        if (script.type === scriptTypes.ATTRIBUTE &&
            !isAllowed
           ) {
            this.removeGivenAttribute(script, reason);
            return;
        }
        if (!isAllowed) {
            // set invalid type if dry run off.
            script.element.setAttribute('type', 'librejs/blocked');
            // add entry as removed.
            console.debug('removeGivenJs hash is', hash);
            script.tagAsRemoved(this.pageURL, reason, hash);
        } else {
            script.element.setAttribute(
                'data-librejs-dryrun', 'librejs/blocked');
            script.tagAsDryRun(this.pageURL, reason, hash);
        }

        if (singleton === true) {
            // flag singletons.
            script.element.setAttribute('data-singleton', 'true');
        }

        // remove src if dry run off.
        if (script.element.getAttribute('src') !== undefined) {
            script.element.setAttribute(
                'data-librejs-blocked-src',
                script.element.getAttribute('src')
            );
            if (!isAllowed) {
                script.element.removeAttribute('src');
            }
        }
        if (isAllowed) {
            comment_str = 'LibreJS: Script should be blocked, but page is whitelisted.';
            script.status = statusTypes.ACCEPTED;
        } else {
            comment_str = 'LibreJS: script blocked.';
            script.status = statusTypes.REJECTED;
        }

        commentedOut = this.dom.createComment(comment_str);
        // add a comment for curious source readers.
        script.element.parentNode.appendChild(commentedOut);
        script.element.parentNode.insertBefore(commentedOut, script.element);
        this.hasRemovedScripts = true;
    }
};

DomHandler.prototype.removeGivenAttribute = function (script, reason) {
    var i = 0,
        le = script.jsAttributes.length;

    console.debug('removing given attribute', script, reason);
    script.element.setAttribute('data-librejs-blocked-event',
                                JSON.stringify(script.jsAttributes));

    script.tagAsRemoved(this.pageURL, reason, script.hash || script.tree.hash);

    // might need to be removed.
    script.element.setAttribute('data-librejs-blocked-value', '');

    if (!allowedRef.urlInAllowedReferrers(this.pageURL)) {
        // only run if not in dry run mode.
        for (; i < le; i++) {
            console.debug('removing attribute', JSON.stringify(script.jsAttributes));
            script.element.removeAttribute(script.jsAttributes[i].attribute);
        }
    } else {

    }
    this.hasRemovedScripts = true;
};

/**
 * removeAllJs
 * Loop through all scripts from top to bottom and add a type
 * attribute 'librejs/blocked' to prevent their interpretation
 * by the browser.
 *
 */
DomHandler.prototype.removeAllJs = function (reason) {
    // remove all js is useless from now on.
    console.debug('removeAllJs');
    this.hasRemovedScripts = true;

    // removeAllJs needs not be run next time.
    this.removedAllScripts = true;

    try {
        this.removeAllArray(this.scripts, reason);
        this.callback(this.dom);
    } catch (x) {
        console.debug(
            'in removeAllJs method: ',
            x,
            'number of scripts is',
            this.numScripts
        );
        this.callback(this.dom);
    }

};

DomHandler.prototype.removeAllArray = function(scriptArray, reason) {
    var script, i = 0, le;
    console.debug('removeAllArray');
    try {
        le = scriptArray.length;
        // loop through all scripts.

        for (; i < le; i++) {
            script = scriptArray[i];
            if (script.type === scriptTypes.INLINE ||
                script.type === scriptTypes.EXTERNAL
               ) {
                this.removeGivenJs(script, reason);
            }
            else if (script.type === scriptTypes.ATTRIBUTE) {
                this.removeGivenAttribute(script, reason);
            }
        }
    } catch (e) {
        this.callback("");
    }

};

exports.DomHandler = DomHandler;

/**
 * exports.domHandler
 * Instantiates a DomHandler and checks the DOM
 * @param dom obj The given dom for analysis.
 * @param pageURL string the URL for the page.
 * @param callback function callback when all the work has been performed.
 */
exports.domHandler = function(
    dom, pageURL, fragment, responseStatus, callback) {
    console.debug("Creating domHandler");
    var domHandler = new DomHandler();
    domHandler.init(dom, pageURL, fragment, responseStatus, callback);

    // use domGatherer methods.
    domHandler.domGatherer = domGatherer(domHandler);

    // use domChecker methods.
    domHandler.domChecker = domChecker(domHandler);

    // launch the whole process.
    console.debug("Calling processScripts");
    domHandler.processScripts();
};
