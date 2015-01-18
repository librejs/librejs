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
/*jshint esnext: true */

const { Cc, Ci, Cu, components } = require("chrome");

var { NetUtil } = Cu.import("resource://gre/modules/NetUtil.jsm");
var { FileUtils } = Cu.import("resource://gre/modules/FileUtils.jsm");
var relationChecker = require("js_checker/relation_checker").relationChecker;
var rc = relationChecker(); // a dummy object for legacy module.
const AUTHOR_REASON = require("script_entries/free_libraries").AUTHOR_REASON;
var relationChecker = require("js_checker/relation_checker").relationChecker; 

const scriptsCached = require("script_entries/scripts_cache").scriptsCached;

let librejsStorage = {

    file: null,
    filename: 'librejs-whitelist.json',
    data: [],

    onLoad: function (callback) {
        // will read the json file.
        this.init();
        this.read(callback);
    },

    init: function () {
        // get the "librejs-whitelist.json" file in the profile directory
        this.file = FileUtils.getFile("ProfD", [this.filename]);
    },

    read: function (callback) {
        // Content type hint is useful on mobile platforms where the filesystem
        // would otherwise try to determine the content type.
        var channel = NetUtil.newChannel(this.file);
        var that = this;
        channel.contentType = "application/json";
        try {
            NetUtil.asyncFetch(channel, function(inputStream, status) {

                if (!components.isSuccessCode(status)) {
                    require("script_entries/free_libraries").init();
                    that.initialWrite();
                }
                
                var raw_data = NetUtil.readInputStreamToString(
                    inputStream, inputStream.available());
                // expand json file back to original contents.
                var re = new RegExp(
                    "[freelib]".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
                    'g'
                );
                raw_data = raw_data.replace(re, AUTHOR_REASON);
                //console.debug("raw_data is ", raw_data);
                // The file data is contained within inputStream.
                // You can read it into a string with
                // get string into json also
                that.data = JSON.parse(raw_data);
                
                callback(that.data);
            });
        } catch (e) {
            that.initialWrite();
        }
    },
    
    initialWrite: function (callback) {
        console.debug("About to write free libraries");
        // our file is not populated with default contents.
        // use free_libraries.js to populate.
        require("script_entries/free_libraries").init();
        this.writeCacheToDB(callback);
    },

    /**
     * writes the contents of scriptsCached to the persistent
     * JSON file.
     */
    writeCacheToDB: function (callback) {
        console.debug("writing to db");
        data = scriptsCached.getCacheForWriting();
        json = JSON.stringify(data);

        // make json file smaller.
        var re = new RegExp(
            AUTHOR_REASON.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        json = json.replace(re, "[freelib]");
        
        var rc = JSON.stringify(relationChecker());
        re = new RegExp(rc.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');    
        json = json.replace(re, "\"[rl]\"");
        //console.debug("this.data is now", this.data);
        this.write(callback, json);
    },
    generateCacheFromDB: function (callback) {
        if (typeof callback === 'undefined') {
            callback = function () {
                // nothing to do.
            };
        }
        this.read(function (data) {
            scriptsCached.bulkImportCache(data);
        });
    },
    write: function (onDataWritten, json) {

        this.init();
        var str;
        if (typeof json === 'undefined') {
            str = JSON.stringify(this.data);
        } else {
            // we are passing json already formatted.
            str = json;
        }
        var ostream = FileUtils.openSafeFileOutputStream(this.file);
        var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
            .createInstance(Ci.nsIScriptableUnicodeConverter);
        converter.charset = "UTF-8";
        var istream = converter.convertToInputStream(str);
        // The last argument (the callback) is optional.
        NetUtil.asyncCopy(istream, ostream, function(status) {
            if (!components.isSuccessCode(status)) {
                // Handle error!
                return;
            }
            if (!onDataWritten) {
                console.debug("onDataWritten is not defined");
                onDataWritten = function () {
                    console.debug("onDataWritten dummy callback triggered");
                };
            }
            // Data has been written to the file.
            onDataWritten();
        });
    },

    /**
     *  getEntry -- Returns a storage entry if it is present.
     */
    getEntry: function (hash) {
        var entry = this.data[hash];
        if (entry) {
            if (entry.result === '[freelib]') {
                entry.result = {
                    'type': 4,
                    'reason': 'This script has been tagged as free ' +
                        'software by LibreJS authors.'
                };
            }
            entry.relationChecker = rc;
            return entry;
        }
        return false;
    }
};

exports.librejsStorage = librejsStorage;
