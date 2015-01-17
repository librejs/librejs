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

var scriptProperties = require("html_script_finder/dom_handler/script_properties");

const scriptTypes = scriptProperties.scriptTypes;
const scriptsCached = require("script_entries/scripts_cache").scriptsCached;

const statusTypes = scriptProperties.statusTypes;
// object model for script entries.
var scriptObject = require("html_script_finder/dom_handler/script_object");

var urlHandler = require("url_handler/url_handler");

var attributeHelpers = require("html_script_finder/dom_handler/attributes");

// javascript:*
var jsInAttrRe = attributeHelpers.jsInAttrRe;

// the list of all available event attributes
var intrinsicEvents = attributeHelpers.intrinsicEvents;

var privacyChecker = require("js_checker/privacy_checker").privacyCheck;

const types = require("js_checker/constant_types");

var checkTypes = types.checkTypes;

// array reflex valid types as listed in
// http://mxr.mozilla.org/mozilla-central/source/content/base/src/nsScriptLoader.cpp#437
// anything appended to end of strings is considered valid:
var jsValidTypes = [
        /^text\/javascript/i,
        /^text\/ecmascript/i,
        /^application\/javascript/i,
        /^application\/ecmascript/i,
        /^application\/x-javascript/i
];

var stripCDATAOpen = /<\!\[CDATA\[/gi;
var stripCDATAClose = /]]>/g;

var stripHtmlCommentsInScript = function (s) {
    s = s.replace(stripCDATAOpen, '');
    s = s.replace(stripCDATAClose, '');
    return s;
};


// gather scripts and javascript in attributes across a dom object.
var DomGatherer = function() {
    // domHandler object.
    this.d = null;
};

/**
 * init
 *
 * assign a reference domHandler object
 * to access/updates its properties.
 *
 */
DomGatherer.prototype.init = function (domHandler) {
    this.d = domHandler;
};

/**
 * scriptHasInvalidType
 *
 * Checks that a script does not have a js "template" type.
 * Normally any script that has a type attribute other than the
 * few allowed ones is not interpreted. But by security, we only
 * discard a few of them.
 *
 * @param script obj The script element.
 * @return returns true if it matches a template type.
 *
 */
DomGatherer.prototype.scriptHasInvalidType = function (script) {
    var i = 0,
    le = jsValidTypes.length;

    var type = script.getAttribute('type');

    if (type === 'librejs/blocked') {
        // js has already been blocked.
        return true;
    }

    if (!type) {
        // type isn't set, don't look further.
        return false;
    }

    for (; i < le; i++) {
        if (jsValidTypes[i].test(type)) {
            return false;
        }
    }

    // type is invalid and
    // hence cannot be executed.
    return true;
};

/**
 * findScripts
 *
 * Assigns the array of scripts in the dom to a property
 * as well as a number of scripts present for looping purposing.
 */
DomGatherer.prototype.findScripts = function() {
    this.d.domScripts = this.d.dom.getElementsByTagName('script');
    this.d.numScripts = this.d.domScripts.length;
};

/**
 * gatherIntrinsicEvents
 *
 * Fetches all the event attributes that might contain JavaScript
 * as well as all element attributes that start with
 * "javascript:".
 *
 */
DomGatherer.prototype.gatherIntrinsicEvents = function() {
    var i = 0, j, k,
    all = this.d.dom.getElementsByTagName('*'),
    max = all.length,
    that = this,
    attrLen, attrib, str, scriptEntry;

    for (; i < max; i++) {
        // look for attributes with value javascript:*
        attributeHelpers.findJSinAttribute(
            all[i],
            function (scriptEntry) {
                if (scriptEntry !== false) {

                    that.d.inlineScripts.push(scriptEntry);
                    that.d.scripts.push(scriptEntry);

                    // add inline script in the count.
                    that.d.numInlineScripts++;
                }
            });

        // look for attributes of on* (onLoad, ...)
        attributeHelpers.findOnJSAttribute(
            all[i],
            function (scriptEntry) {
                if (scriptEntry !== false) {
                    that.d.inlineScripts.push(scriptEntry);
                    that.d.scripts.push(scriptEntry);

                    // add inline script in the count.
                    that.d.numInlineScripts++;
                }
            });
    }

};

/**
 * gatherScriptsContent
 *
 * Aggregate all content within on-page JavaScript code.
 * Keep a list of all absolute urls to external scripts.
 *
 */
DomGatherer.prototype.gatherScriptsContent = function() {
    var i = 0, currentScript = '', absolutePath, scriptEntry,
    that = this;
    try {
        for (; i < this.d.numScripts; i++) {
            if (this.d.checkScriptForJsWebLabels(this.d.domScripts[i])) {
                //break;
                absolutePath = urlHandler.resolve(
                    this.d.pageURL, this.d.domScripts[i].src);
                scriptEntry = scriptObject.Script(
                    {'type': scriptTypes.EXTERNAL,
                     'status': statusTypes.JSWEBLABEL,
                     'element': this.d.domScripts[i],
                     'url': absolutePath});
                scriptEntry.tree = {};

                this.d.externalScripts.push(scriptEntry);
                that.d.scripts.push(scriptEntry);

                this.d.loadsHtmlExternalScripts = true;

                // increment number of scripts found.
                this.d.numExternalScripts++;
            }

            // check that script has valid type
            else if (!this.scriptHasInvalidType(this.d.domScripts[i])) {


                if (this.d.hasSrc(this.d.domScripts[i]) &&
                    !this.d.scriptHasJsWebLabel(this.d.domScripts[i])) {

                    console.debug('an external script', this.d.domScripts[i]);

                    absolutePath = urlHandler.resolve(
                        this.d.pageURL, this.d.domScripts[i].src);
                    scriptEntry = scriptObject.Script(
                        {'type': scriptTypes.EXTERNAL,
                         'status': statusTypes.UNCHECKED,
                         'element': this.d.domScripts[i],
                         'url': absolutePath});
                    this.d.externalScripts.push(scriptEntry);
                    that.d.scripts.push(scriptEntry);

                    this.d.loadsHtmlExternalScripts = true;

                    // increment number of scripts found.
                    this.d.numExternalScripts++;

                } else if (privacyChecker.checkScriptPrivacyThreat(this.d.domScripts[i].text)) {
                    this.d.removeGivenJs(scriptObject.Script(
                        {'type': scriptTypes.SINGLETON,
                         'status': statusTypes.UNCHECKED,
                         'element': this.d.domScripts[i],
                         'text': this.d.domScripts[i].text
                        }), '', true);
                } else if (this.d.domScripts[i].text !== '') {
                    // using else if since script text is
                    // ignored if src attribute is set.
                    // adding this.narcissusBugFixLibreJS to fix comment bug.
                    var bugfix = require('html_script_finder/bug_fix').narcissusBugFixLibreJS;
                    currentScript = stripHtmlCommentsInScript(this.d.domScripts[i].text + bugfix);

                    scriptEntry = scriptObject.Script(
                        {'type': scriptTypes.INLINE,
                         'status': statusTypes.UNCHECKED,
                         'element': this.d.domScripts[i],
                         'text': currentScript});
                    this.d.inlineScripts.push(scriptEntry);
                    this.d.scripts.push(scriptEntry);

                    // add inline script in the count.
                    this.d.numInlineScripts++;
                }
            }
        }
    } catch (e) {
        // Any problem arising, we remove the script.
        console.debug('problem gathering scripts', e, e.lineNumber);
        this.d.removeAllJs();
    }
};

/*
 * exports.domGatherer
 * Instantiate a brand new clone of the domGatherer.
 * @param dom obj The given dom for analysis.
 * @param pageURL string the URL for the page.
 * @param callback function callback when all the work has been performed.
 */
exports.domGatherer = function (domHandler) {
    var dg = new DomGatherer();
    dg.init(domHandler);
    return dg;
};
