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

var data = require("sdk/self").data;
var {Cu} = require("chrome");
var {ChromeWorker} = Cu.import("resource://gre/modules/Services.jsm", null);
var worker = new ChromeWorker(
    data.url("chrome_worker/parser/parse.js"));

var NarcissusWorker = function() {
    this.worker = worker;
    var that = this;

    this.worker.onmessage = function(e) {
        var jsChecker = require("js_checker/js_checker");

        console.debug('onmessage', e.data.hash);
        try {
            console.debug('calling jsChecker.callbackHashResult() for hash:',
                          e.data.hash);
            jsChecker.callbackHashResult(e.data.hash, e.data.tree);
        } catch (x) {
            console.debug('error on message', x);
            jsChecker.callbackHashResult(e.data.hash, false);
        }
        jsChecker = null;
    };

    // Enabling the catch clause in data/chrome_worker/parser
    // instead of here because we can get the hash from there.
    /*this.worker.onerror = function (e) {
        console.debug(
            'error', e.lineno,
            'in', e.filename,
            'e', e.message,
            'full message', e
        );
        // can't get hash from this context
        that.worker.postMessage(JSON.stringify({'hash': null}));
    };*/
};

NarcissusWorker.prototype.stopWorker = function() {
    console.debug('stopping worker');
    this.worker.postMessage('stop');
};

NarcissusWorker.prototype.parse = function(scriptText, hash) {
    console.debug('parsing', hash);
    try {
        this.worker.postMessage(JSON.stringify({
            'code': scriptText,
            'hash': hash
        }));
    } catch (x) {
        console.debug('error in lib/narcissus_worker.js', x, x.lineNumber);
    }

};

var narcissusWorker = new NarcissusWorker();
exports.narcissusWorker = narcissusWorker;
