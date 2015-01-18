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

const types = require("js_checker/constant_types");
const scriptsCached = require("script_entries/scripts_cache").scriptsCached;
const xhr = require('html_script_finder/dom_handler/dom_checker').xhr;
const timers = require("sdk/timers");

exports.addToCache = function (lic, delay, jsWebLabelsURL, callback) {
    console.debug("jslicenseURL is", jsWebLabelsURL);
    if (typeof delay === 'undefined') {
        delay = 0;
    }

    // get file hash and store as cached.
    console.debug('performing xhr for', lic.fileUrl);
    timers.setTimeout(function() {
        var cb = function (script, contents) {
            try {
                // add a cache entry.
                var hash = scriptsCached.addEntryIfNotCached(
                    contents,
                    types.freeWithComment(
                        'This script is free according to a JS Web Labels ' +
                            'page visited recently (at ' +
                            jsWebLabelsURL.replace("librejs=true", "") + ' )'
                    ),
                    {},
                    true,
                    lic.fileUrl
                );
                console.debug('returning xhr from', lic.fileUrl);
                callback(lic.fileUrl);
            } catch (e) {
                callback(lic.fileUrl);
            }
        };
        // just callback after 5 seconds if we don't get the answer yet.
        timers.setTimeout(function() {
            cb = function() {};
            callback(lic.fileUrl); }, 20000);

        xhr({'url': lic.fileUrl}, cb);
    }, delay);
};
