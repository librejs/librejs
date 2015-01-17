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

var whitelist = [];

var prefSet = require("sdk/simple-prefs");
var {Cc, Ci, Cu, Cm, Cr} = require("chrome");

var prompt = Cc['@mozilla.org/embedcomp/prompt-service;1'].
    getService(Ci.nsIPromptService);
var scriptsCached = require("script_entries/scripts_cache").scriptsCached;

var setWhitelist = function () {
    whitelist = [];

    var str;
    var whitelistString;
    if (typeof prefSet.prefs.whitelist === 'undefined') {
        whitelistString = '';
    } else {
        whitelistString = prefSet.prefs.whitelist.split(',');
    }

    for (var i = 0; i < whitelistString.length; i++) {
        // remove space, trailing slash, escape any nonalpha except *,
        // replace * with .*
        str = whitelistString[i]
            .replace(" ", "").replace(/\/$/, "")
            .replace(/[^a-z0-9\*]/ig, "\\$&").replace("*", ".*");

        if (str !== '') {
            whitelist.push(
                new RegExp('^https?:\/\/(www\\.)?' + str + '/', 'i'));
        }
    }
};

exports.getWhitelist = function () {
    return whitelist;
};

exports.init = function () {
    setWhitelist();
};

prefSet.on("whitelist", setWhitelist);

/*var setDryRun = function () {
    var dryRun = prefSet.prefs.dryrun;
    if (dryRun === true) {
        prompt.alert(null, "LibreJS Dry Run Mode", "Is Dry Run Mode really what you want? LibreJS will still analyze JavaScript on a page, but it will not block any of it. As a result, ALL of the JavaScript on a page will run as is, whether it is free and trivial or not. You will not be warned again. Uncheck that box if you are unsure.");
        scriptsCached.resetCache();
    } else {
        prompt.alert(null, "LibreJS Dry Run Mode", "LibreJS Dry Run Mode is now disabled");
    }
};*/

//prefSet.on("dryrun", setDryRun);

/*exports.isDryRun = function () {
     // Returns true if dryRun mode is enabled. False otherwise.
    //return prefSet.prefs.dryrun;
    return false;
};*/

var setComplaintTab = function () {
    var complaintTab = prefSet.prefs.complaint_tab;
    if (complaintTab === true) {
        prompt.alert(null, "Turning on complaint tab", "A complaint tab will be displayed on pages where nonfree nontrivial JavaScript is found and contact information is found as well.");
    } else {
        prompt.alert(null, "Turning off complaint tab", "No complaint tab will appear on pages, even when nonfree nontrivial JavaScript is found.");
    }
};
prefSet.on("complaint_tab", setComplaintTab);

exports.isComplaintTab = function () {
    /**
     * Returns true if complaint tab mode is enabled. False otherwise.
     */
    return prefSet.prefs.complaint_tab;
};

var setDisplayNotifications = function () {
    var displayNotifications = prefSet.prefs.display_notifications;
    if (displayNotifications === true) {
        prompt.alert(null, "Turning on notifications", "Notifications with code snippets will now appear while LibreJS is analyzing JavaScript on a page.");
    } else {
        prompt.alert(null, "Turning off notifications", "Notifications of code being analyzed will not be displayed.");
    }
};

prefSet.on("display_notifications", setDisplayNotifications);

exports.isDisplayNotifications = function () {
    /**
     * Returns true if complaint tab mode is enabled. False otherwise.
     */
    return prefSet.prefs.display_notifications;
};

exports.complaintEmailSubject = function() {
    return prefSet.prefs.complaint_email_subject;
};

exports.complaintEmailBody = function() {
    return prefSet.prefs.complaint_email_body;
};
