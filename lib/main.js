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

// Uncomment the following to start debugging, or do it from about:config.
// var name = "extensions.jid1-KtlZuoiikVfFew@jetpack.sdk.console.logLevel";
// require("sdk/preferences/service").set(name, "all");

const { Cc, Ci } = require("chrome");

const librejsStorage = require("settings/storage").librejsStorage;
let addonManage = require("addon_management/install_uninstall");
let httpObserver = require("http_observer/http_request_observer");
let prefObserver = require("pref_observer/pref_observer");
let prefChange = require("addon_management/prefchange");
let uiInfo = require("ui/ui_info");
let scriptPanel = require("ui/script_panel.js");
const removeHashCallback = require("js_checker/js_checker").removeHashCallback;

require('ui');

// set whitelist at startup.
prefChange.init();
var widgetIsOn = false;

// read storage file.
var cachedResult = librejsStorage.init();
librejsStorage.generateCacheFromDB();

exports.main = function(options, callbacks) {
    if (options.loadReason === 'enable' || 
	    options.loadReason === 'install'
       ) {
	    addonManage.onLoad();
    }
};

exports.onUnload = addonManage.onUnload;
exports.onLoad = addonManage.onLoad;

var prefs = require('sdk/preferences/service');
var isJavaScriptEnabled = prefs.get('javascript.enabled');
if (!isJavaScriptEnabled) {
    console.debug('JS disabled in add-on init');
    // remove all http notifications
    httpObserver.removeHttpObserver();
    // TODO: the narcissus worker could also be stopped at this
    // point, but I'm not doing that right now because I don't
    // know how to re-enable it.
    //narcissusWorker.stopWorker();
} else {
    console.debug('JS enabled in add-on init');
}
prefObserver.register();
