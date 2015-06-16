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
var relationChecker = require("js_checker/relation_checker").relationChecker;

var crypto = require('script_entries/crypto');
const checkTypes = require("js_checker/constant_types").checkTypes;

// cachedResults contains objects with result/relationChecker for
// scripts entries indexed by SHA1sum
var cachedResults = {};

/**
 * ScriptsCached keeps a cache of whitelisted scripts in the browser
 * session.
 */
var ScriptsCached = function() {
};

ScriptsCached.prototype.getHash = function(scriptText) {
    require('ui/notification').createNotification(scriptText.substring(0,100));

    return crypto.sha1Encrypt(scriptText);
};

/**
 * resetCache
 * Resets the full cache and re-initialize
 * the free libraries list.
 */
ScriptsCached.prototype.resetCache = function () {
    cachedResults = {};
    // import free_libraries to populate the cache hash map.
    var free_libraries = require("script_entries/free_libraries");
    free_libraries.init();
};
  
/**
 * 
 * addEntry
 * 
 * Adds a script entry to the cache by providing the results
 * and the actual script text.
 * 
 */
ScriptsCached.prototype.addEntry = function(
    scriptText, result, relationCheckerObj, allowTrivial, url
) {
    console.debug("result addEntry is", JSON.stringify(result));
    cachedResults[this.getHash(scriptText)] = {
        'result': result,
        'relationChecker': relationChecker(),
        'allowTrivial': allowTrivial,
        'url': url
    };
};

/**
 * 
 * addEntry
 * 
 * Adds a script entry to the cache by providing the results
 * using the script's hash.
 * 
 */
ScriptsCached.prototype.addEntryByHash = function(
        hash, result, relationChecker, allowTrivial, url) {
    cachedResults[hash] = {
        'result': result,
        'relationChecker': relationCheckerObj(),
        'allowTrivial': allowTrivial,
        'url': url || ''
    };
};

/**
 *  removeEntryByHash
 *  
 *  Remove an entry from the cache using hash key.
 */
ScriptsCached.prototype.removeEntryByHash = function(hash) {
    delete cachedResults[hash];
};
  
/**
 * addEntryIfNotCached
 * 
 * Checks first if entry is cached before attempting to cache result.
 */
ScriptsCached.prototype.addEntryIfNotCached = function(
        scriptText, result, relationChecker, allowTrivial, url) {
    // save a bit of computing by getting hash once.
    var hash = this.getHash(scriptText);
    console.debug('hash is then', hash);
    if (!this.isCached(scriptText, hash)) {
        cachedResults[hash] = {
            'result': result,
            'relationChecker': relationCheckerObj(),
            'allowTrivial': allowTrivial,
            'url': url || ''
        };
    }
    return hash;
};

/**
 * 
 * addObjectEntry
 * 
 * Adds a script entry by providing an object.
 * Used to provide free library hashes from free_libraries.js
 * 
 */
ScriptsCached.prototype.addObjectEntry = function(hash, script) {
    cachedResults[hash] = script;
};

ScriptsCached.prototype.isCached = function(scriptText, hash) {
    var scriptHash;
    console.debug("Is CACHED start?");
    try {
        if (typeof hash === 'string') {
            scriptHash = hash;
        } else {
            scriptHash = this.getHash(scriptText);
        }
        if (typeof scriptHash === 'string') {
            let cachedResult = cachedResults[scriptHash];
            if (cachedResult) {
                // exact copy of file has already been cached.
                console.debug('scriptHash is', cachedResult);
                if (cachedResult.relationChecker == "[rl]") {
                    cachedResult.relationChecker = {}; //relationCheckerObj();
                }          
                console.debug("Is Cached ENd TRUE");
                return cachedResult;
            }
        }
        return false;
    } catch (e) {
        console.debug("an error", scriptHash, e, e.linenumber, e.filename);
    }
};

/**
 * Writes allowed scripts to the cache.
 * nonfree/nontrivial scripts are not added to the cache.
 */
ScriptsCached.prototype.getCacheForWriting = function() {
    var formattedResults = {};
    for (let item in cachedResults) {
        let type = cachedResults[item].result.type;
        if (type != checkTypes.NONTRIVIAL &&
            type != checkTypes.TRIVIAL_DEFINES_FUNCTION
           ) {
            formattedResults[item] = cachedResults[item];
        }
    }
    return formattedResults;
};

/**
 * Import data from database into cachedResults.
 * Calling this function replaces the current cache if it exists.
 */
ScriptsCached.prototype.bulkImportCache = function(data) {
    cachedResults = data;
    console.debug("Imported data. Number of keys ISSS ",
                  Object.keys(cachedResults).length);
    console.debug("It looks like ", JSON.stringify(cachedResults));
};

exports.scriptsCached = new ScriptsCached();
