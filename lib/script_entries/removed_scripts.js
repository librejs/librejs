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

var allScripts = require('script_entries/all_scripts').allScripts;
const urlHandler = require('url_handler/url_handler');

var RemovedScripts = function() {
    this.scripts = {};
    this.truncateJsData = allScripts.truncateJsData;
    this.getScripts = allScripts.getScripts;
    this.isFound = allScripts.isFound;
    this.returnWhenFound = allScripts.returnWhenFound;
    this.getOrInitScripts = allScripts.getOrInitScripts;
    this.reverseArray = allScripts.reverseArray;
    this.setHash = allScripts.setHash;
};

RemovedScripts.prototype.clearScripts = function (url) {
    this.scripts[url] = [];
};

/**
 * addAScript
 * adds a single script to the scripts array.
 * @param {string} url - the url of the page where it is loaded.
 * @param {object} scriptObj - Additional data regarding this script,
 *        including: inline: boolean,
 *                   contents: string,
 *                   removalReason: string.
 */
RemovedScripts.prototype.addAScript = function (url, scriptObj, absoluteUrl) {
    var exists;

    if (this.scripts[url] === undefined) {
        this.clearScripts(url);
    }
    if (scriptObj.inline === true) {
        this.setHash(scriptObj);
        this.truncateJsData(scriptObj);
    } else if (absoluteUrl !== undefined &&
            scriptObj.inline === false) {
                scriptObj.contents = urlHandler.resolve(absoluteUrl, scriptObj.contents);
            }
    exists = this.isFound(url, scriptObj);

    if (!exists) {
        this.scripts[url].push(scriptObj);
        return true;
    } else {
        return false;
    }
};

exports.removedScripts = new RemovedScripts();
