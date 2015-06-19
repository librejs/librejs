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

var acceptedScripts = require("../script_entries/accepted_scripts")
    .acceptedScripts;
var allowedRef = require('../http_observer/allowed_referrers')
    .allowedReferrers;

var urlHandler = require("../url_handler/url_handler");

var ScriptAnalyzer = function() {
    // the URL of the current page.
    this.pageURL = null;
};

/*
 * analyzeScriptBeforeExec
 *
 * Ensure that the script is found in the acceptedScript before
 * allowing to execute it.
 *
 */
ScriptAnalyzer.prototype.analyzeScriptBeforeExec = function (e) {
    if (typeof e.target.textContent === 'undefined') {
        throw new TypeError('event.target must be a script element');
    }
    console.debug('analyzeScriptBeforeExec executed');

    var script = e.target, isAccepted;
    var text = script.src ?
        script.src : script.textContent.substring(0,100);
    var notif = require("ui/notification")
        .createNotification(text).notification;
    this.pageURL = urlHandler.removeFragment(script.ownerDocument.URL);
    if (!allowedRef.urlInAllowedReferrers(this.pageURL)) {

        if (script.src !== undefined && script.src !== '') {
            isAccepted = this.checkExternalScript(script);
        } else {
            isAccepted = this.checkInlineScript(script);
        }

        if (isAccepted === false && 
            !(/^(file:\/\/|chrome:\/\/|about\:)/.test(this.pageURL))
           ) {
            console.debug(this.pageURL);
            // file:// types of pages are allowed.

            // set invalid type so that the script is detected
            // by LibreJS as blocked (although it's blocked using
            // preventDefault().
            script.setAttribute('type', 'librejs/blocked');
            //script.setAttribute('data-librejs-blocked', 'dynamically');
            script.setAttribute('data-librejs-blocked-src', script.src);
            script.removeAttribute('src');

            e.preventDefault();
            return false;
        } else {
            console.debug("script is accepted", script.src);
            script.setAttribute('data-librejs-accepted', 'dynamically');
            return true;
        }

    } else {
        return true;
    }

    return false;
};

ScriptAnalyzer.prototype.checkExternalScript = function (script) {
    var url = urlHandler.resolve(this.pageURL, script.src);

    if  (this.isScriptAccepted(url, false)) {
        // url in src attribute is found as accepted.
        return true;
    }

    else {
        // the script hasn't been accepted before.
        // block it.
        console.debug("script is not accepted", script.src);
        return false;
    }

};

ScriptAnalyzer.prototype.checkInlineScript = function (script) {
    return this.isScriptAccepted(script.text, true);
};

ScriptAnalyzer.prototype.isScriptAccepted = function (contents, inline) {

    if (!acceptedScripts.isFound(this.pageURL, {'inline': inline, 'contents': contents})) {
        return false;
    } 

    else {
        return true;
    }
};

var scriptAnalyzer = new ScriptAnalyzer();

var jsLoadObserver = {
    observe: function (domWindow) {
        domWindow.document.addEventListener(
            "beforescriptexecute",
            scriptAnalyzer.analyzeScriptBeforeExec.bind(scriptAnalyzer),
            false);
    }
};

observerService.addObserver(jsLoadObserver, 
                            'content-document-global-created',
                            false);

exports.removeJsLoadObserver = function () {
    observerService.removeObserver(jsLoadObserver,
                                   'content-document-global-created');
    console.debug('removing jsLoadObserver');
};
