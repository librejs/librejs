/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2014 Loic J. Duros
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

var tabs = require("sdk/tabs");
var pageMod = require("sdk/page-mod");

// use the two buckets.
var removedScripts = require("script_entries/removed_scripts").removedScripts;
var acceptedScripts = require("script_entries/accepted_scripts").acceptedScripts;

var jsLoadObserver = require("js_load_observer/js_load_observer");

var reset = function(url) {
    acceptedScripts.clearScripts(url);
};

// FIXME
/*
exports.testJsLoadObserverHttpObserverBypassed = function(assert, done) {
    var url = 'http://lduros.net/assets/librejs/tests/load_observer/load_test.html';
    var mod;
    
    reset(url);
    
    mod = pageMod.PageMod({
        include: '*',
        contentScriptWhen: 'ready',
        contentScript: 'self.postMessage(num);',
        onError: function(e) {
            assert.equal(e.toString(),
                         'ReferenceError: num is not defined',
                         'throws ReferenceError');
            done();
            mod.destroy();
        }
    });
    
    tabs.open(url);
};*/

// FIXME
/*
exports.testJsLoadObserverHttpObserverBypassed2 = function(assert, done) {
    var url = 'lduros.net/assets/librejs/tests/load_observer/wrong_mimetype/';
    var mod;

    reset(url);
    
    mod = pageMod.PageMod({
        include: '*',
        contentScriptWhen: 'ready',
        contentScript: 'self.postMessage(unsafeWindow.jsString);',
        onAttach: function(worker) {
            worker.on('message', function(value) {
                assert.equal(value, null, 'JS isn\'t executed');
                done();
                mod.destroy();
            });
        }
    });
    
    tabs.open(url);    
};*/

// FIXME
/*
exports.testJsLoadObserverAccepted = function(assert, done) {
    var url = 'http://lduros.net/assets/librejs/tests/load_observer/load_test.html';
    var mod;

    reset(url);
    acceptedScripts.addAScript(url, {
        'inline': true,
        'contents': 'var num = 5;'
    });

    assert.equal(
        acceptedScripts.scripts[url][
            acceptedScripts.scripts[url].length - 1].hash,
        '49ca8516cacaa673a4793aaf53f9ae8c7ed2d170',
        'script hash matches');
		     
    mod = pageMod.PageMod({
        include: '*',
        contentScriptWhen: 'ready',
        contentScript: 'self.postMessage(unsafeWindow.num);',
        onAttach: function(worker) {
            worker.on('message', function(value) {
                assert.equal(value, 5, 'javascript value is executed');
                done();
                mod.destroy();
            });
        }
    });
    
    tabs.open(url);
};*/

// FIXME
/*
exports.testJsLoadObserverAcceptedExternalWrongMimeType = function(
    assert, done
) {
    var url = 'lduros.net/assets/librejs/tests/load_observer/wrong_mimetype/';
    var mod;

    reset(url);
    acceptedScripts.addAScript(url, {
        'inline': true,
        'contents': "var jsString = \"JavaScript is loaded on this page.\";" +
            "\nalert('this is JavaScript with an HTML content-type " +
            "response header!!');"
    });

    assert.equal(
        acceptedScripts.scripts[url][
            acceptedScripts.scripts[url].length - 1].hash,
        '56e9636015385c0883d606ffc360eb510c1ac3a7',
        'script hash matches');

    mod = pageMod.PageMod({
        include: '*',
        contentScriptWhen: 'ready',
        contentScript: 'self.postMessage(unsafeWindow.jsString);',
        onAttach: function(worker) {
            worker.on('message', function(value) {
                assert.equal(value, null, 'JS isn\'t executed');
                done();
                mod.destroy();
            });
        }
    });
    
    tabs.open(url);    
};*/

require('sdk/test').run(exports);
