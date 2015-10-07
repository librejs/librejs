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

// THIS MODULE IS DEPRECATED IN FAVOR OF THE NEW WHITELISTING MODULE (LibreJS 6.0)

var relationChecker = require("js_checker/relation_checker").relationChecker;
var checkTypes = require("js_checker/constant_types").checkTypes;
var scriptsCached = require("script_entries/scripts_cache").scriptsCached;


// find the json database path.
var dbContents = require("sdk/self").data.load("script_libraries/script-libraries.json");

const AUTHOR_REASON = "This script has been tagged as free software by LibreJS authors.";

var freeLibraries = JSON.parse(dbContents); /* a database of the free libraries recognized by default */

/*
 * List of free libraries and their SHA256 hash.
 * This is used to recognize the most common free libraries.
 */

var init = function () {

    // relationChecker, which roughly checks if variables are window
    //  variables or not, is useless in this case.  Use the same
    //  object for all entries.
    var rc = relationChecker();
    var library, hash;
    var freeObj = { "type": 4, "reason": AUTHOR_REASON};
    console.debug("Building init");
    for (hash in freeLibraries) {
        library = freeLibraries[hash];

        // assign empty relationChecker object.
        library.relationChecker = rc;

        // make them free and nontrivial.
        library.result = freeObj;

        scriptsCached.addObjectEntry(hash, library);
    }
};

//init();

exports.init = init;
exports.AUTHOR_REASON = AUTHOR_REASON;
