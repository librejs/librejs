/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2014 Loic J. Duros
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

var acceptedScripts = require('script_entries/accepted_scripts')
    .acceptedScripts;

exports.testAddAScript = function (assert) {
    var str = "http://www.lduros.net/assets/blah.js";
    var script = {inline: false, contents: str};
    assert.strictEqual(script.contents, str);
    assert.strictEqual(
        acceptedScripts.addAScript('http://www.example.org/', script), true);
    var fetchedScript = acceptedScripts.getScripts('http://www.example.org/');
    assert.ok(fetchedScript);
    assert.strictEqual(fetchedScript[0].contents, str);
};

exports.testAddAScriptTwice = function (assert) {
    var str = "http://www.lduros.net/assets/blah.js";
    var script = {inline:false, contents: str};
    assert.strictEqual(
        acceptedScripts.addAScript('http://www.example.org/', script), false);
};

exports.testIsFound = function (assert) {
    var url = 'http://lduros.net/';
    var str = "http://www.lduros.net/assets/blah.js";
    var script = {inline:false, contents: str};
    acceptedScripts.addAScript('http://lduros.net/', script);
    assert.strictEqual(acceptedScripts.isFound(url, script), true);
};

exports.testIsFoundHash = function (assert) {
    var str = "var i = 0;";
    var hash = '1621f3b5cfc1c3753f347349677f53e82285a2f1';

    // Unline in test-all_scripts.js, we are not adding hash here.
    // The hash property should be added during addAScript execution.
    var obj = {'inline': true, 'contents': str};
    acceptedScripts.addAScript('http://example.com/', obj);
    assert.strictEqual(
        acceptedScripts.scripts['http://example.com/'][acceptedScripts.scripts['http://example.com/'].length -1].hash, hash);
    assert.strictEqual(
        acceptedScripts.isFound('http://example.com/', obj), true);
};

require('sdk/test').run(exports);
