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

var jsLoadObserver = require("js_load_observer/js_load_observer");
var tabs = require("sdk/tabs");

// use the two buckets.
var removedScripts = require("script_entries/removed_scripts").removedScripts;
var acceptedScripts = require("script_entries/accepted_scripts").acceptedScripts;
var mockDom = require("./mock/mock_dom");

exports.testCheckInlineScriptAccepted = function (test) {
    var dom = mockDom.emptyDocument();
    var script = dom.createElement('script');
    var e = {
        target: script,
        preventDefault: function () {
            console.log('default prevented');
        }
    }; 

    e.target.ownerDocument = { URL: 'http://example.org/' };
    e.target.textContent = "var num = 10;";
    acceptedScripts.addAScript(e.target.ownerDocument.URL, {
        inline: true,
        contents: e.target.textContent
    });
    jsLoadObserver.scriptAnalyzer.analyzeScriptBeforeExec(e);

    test.assertEqual(
        jsLoadObserver.scriptAnalyzer.checkInlineScript(e.target),
        true,
        "not found in accepted scripts");
};

exports.testCheckInlineScriptNotAcceptedThenAccepted = function (test) {
    var dom = mockDom.emptyDocument();
    var script = dom.createElement('script');
    var e = { target: script };
    e.target.ownerDocument = { URL: 'http://example.org/' };
    e.target.textContent = "var num = 12;";

    test.assertEqual(
        jsLoadObserver.scriptAnalyzer.checkInlineScript(e.target),
        false,
        "found in accepted scripts");

    acceptedScripts.addAScript(e.target.ownerDocument.URL,
        {
            inline: true,
            contents: e.target.textContent
        });

    test.assertEqual(
        jsLoadObserver.scriptAnalyzer.checkInlineScript(e.target),
        true,
        "not found in accepted scripts");
};
