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

var crypto = require('./crypto');

var AllScripts = function() {
    this.scripts = {};
};

AllScripts.prototype.truncateJsData = function (scriptObj) {
    if (scriptObj.contents === undefined) {
        console.debug('this is an inline script', scriptObj.value);
        console.debug('this is an src', scriptObj.url);
    }
    if (scriptObj.contents.length > 1000) {
        scriptObj.contents = scriptObj.contents.substring(0, 1000);
        scriptObj.contents += '…';
    }
};

AllScripts.prototype.setHash = function (scriptObj) {
    scriptObj.hash = crypto.sha1Encrypt(scriptObj.contents);
    return scriptObj.hash;
};

AllScripts.prototype.getScripts = function (url) {
    if (!this.scripts[url]) {
        return false;
    } else {
        return this.scripts[url];
    }
};

AllScripts.prototype.reverseArray = function (url) {
    this.scripts[url].reverse();
};

AllScripts.prototype.getOrInitScripts = function (url) {
    if (this.scripts[url] === undefined) {
        this.scripts[url] = [];
    }
    return this.scripts[url];
};

AllScripts.prototype.returnWhenFound = function(url, data) {
    var pageScripts = this.getOrInitScripts(url),
        i = 0,
        le = pageScripts.length;

    // check that entry doesn't exist.
    if (data.inline === false) {
        for (; i < le; i++) {
            if (pageScripts[i].contents === data.url) {
                return pageScripts[i];
            }
        }
    } else if (data.inline === true) {
        for (; i < le; i++) {
            if (pageScripts[i].hash === crypto.sha1Encrypt(data.contents)) {
                return pageScripts[i];
            }
        }
    }

    return false;
};

AllScripts.prototype.isFound = function(url, data) {
    var pageScripts = this.getOrInitScripts(url),
        i = 0,
        le = pageScripts.length;

    // check that entry doesn't exist.
    if (data.inline === false) {
        for (; i < le; i++) {
            if (pageScripts[i].url === data.url) {
                return true;
            }
        }
    } else if (data.inline === true) {
        for (; i < le; i++) {
            if (pageScripts[i].hash === crypto.sha1Encrypt(data.contents)) {
                return true;
            }
        }
    }

    return false;
};

exports.allScripts = new AllScripts();
