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
 * The following module is intended to perform tasks when the
 * add-on is enabled and disabled.
 */ 

const {Cc, Ci, Cu, Cm, Cr} = require("chrome");

const httpObserver = require("http_observer/http_request_observer");
var narcissusWorker = require("parser/narcissus_worker")
    .narcissusWorker;
const caching = require("http_observer/caching");

const prompt = Cc["@mozilla.org/embedcomp/prompt-service;1"].
  getService(Ci.nsIPromptService);


const tabs = require('sdk/tabs');

/**
 * Stop the httpObserver when the add-on is disabled or removed.
 */
exports.onUnload = function(reason) {
    if (reason == "disable" || 
        reason == "shutdown" ||
        reason == "upgrade" ||
        reason == "downgrade") {
        require("settings/storage").librejsStorage.writeCacheToDB();
        // remove all http notifications
        httpObserver.removeHttpObserver();
        // remove worker.
        narcissusWorker.stopWorker();
    }

};

exports.onLoad = function () {
  try {
    var clearCache = prompt.dialog(null, "LibreJS installation", "If you have tabs and windows opened prior to installing LibreJS, you will have to refresh them for their JavaScript to be analyzed and blocked. Press OK to clear the browser cache.");
    if (clearCache) {
	    caching.clearAllCache();
    }
  } catch (e) {
	  console.debug(e);
  }
};
