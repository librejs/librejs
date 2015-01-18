/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
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

var {Cc, Ci} = require("chrome");
const httpObserver = require("http_observer/http_request_observer");

// https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Preferences#Using_preference_observers
var prefObserver = {
    register: function() {
        // First we'll need the preference services to look for preferences.
        var prefService = Cc["@mozilla.org/preferences-service;1"]
            .getService(Ci.nsIPrefService);

        // For this.branch we ask for the preferences for
        // extensions.myextension. and children
        this.branch = prefService.getBranch("javascript.");

        // Finally add the observer.
        this.branch.addObserver("", this, false);
    },

    unregister: function() {
        this.branch.removeObserver("", this);
    },

    observe: function(aSubject, aTopic, aData) {
        // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
        // aData is the name of the pref that's been changed (relative to
        // aSubject)
        switch (aData) {
            case "enabled":
                var prefs = require('sdk/preferences/service');
                var isJavaScriptEnabled = prefs.get('javascript.enabled');
                if (!isJavaScriptEnabled) {
                    console.debug('JS disabled in observer');
                    // remove all http notifications
                    httpObserver.removeHttpObserver();

                    // TODO: the narcissus worker could also be stopped at this
                    // point, but I'm not doing that right now because I don't
                    // know how to re-enable it.
                    // narcissusWorker.stopWorker();
                } else {
                    console.debug('JS enabled in observer');
                    httpObserver.startHttpObserver();
                }
                break;
        }
    }
};

exports.register = function() {
    prefObserver.register();
};
