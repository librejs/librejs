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

var removedScripts = require('script_entries/removed_scripts').removedScripts;

exports.truncateDataTest = function(test) {
    var str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque ultricies molestie tellus, eu ullamcorper dui luctus sit amet. Morbi sed urna eu justo malesuada bibendum nec non est. Sed sagittis sodales ullamcorper. Mauris dolor arcu, dignissim ac sollicitudin ac, tempus at orci. Curabitur pretium risus id urna congue cursus. Nulla ullamcorper faucibus nibh, eget ultrices ante vestibulum id. Vestibulum elementum ullamcorper mi, id ultrices lacus faucibus et. Nullam lectus augue, suscipit a elementum at, malesuada eget nulla. Aenean tempus ultrices elit ut vulputate. Ut congue magna ultricies felis rutrum eget ultricies nibh vehicula. In id pellentesque risus. Pellentesque aliquam quam eros, quis placerat eros. Cras molestie, turpis et consectetur sollicitudin, magna enim mattis lectus, et adipiscing erat urna in risus. Vestibulum sed arcu vitae mauris ornare ultricies a sit amet leo. Praesent pharetra, urna in varius fermentum, neque nibh tempor justo, id ullamcorper magna amet.…";
    var t = {contents: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque ultricies molestie tellus, eu ullamcorper dui luctus sit amet. Morbi sed urna eu justo malesuada bibendum nec non est. Sed sagittis sodales ullamcorper. Mauris dolor arcu, dignissim ac sollicitudin ac, tempus at orci. Curabitur pretium risus id urna congue cursus. Nulla ullamcorper faucibus nibh, eget ultrices ante vestibulum id. Vestibulum elementum ullamcorper mi, id ultrices lacus faucibus et. Nullam lectus augue, suscipit a elementum at, malesuada eget nulla. Aenean tempus ultrices elit ut vulputate. Ut congue magna ultricies felis rutrum eget ultricies nibh vehicula. In id pellentesque risus. Pellentesque aliquam quam eros, quis placerat eros. Cras molestie, turpis et consectetur sollicitudin, magna enim mattis lectus, et adipiscing erat urna in risus. Vestibulum sed arcu vitae mauris ornare ultricies a sit amet leo. Praesent pharetra, urna in varius fermentum, neque nibh tempor justo, id ullamcorper magna amet. Something after 1000 character here should be removed."};
    
    test.assertEqual(str.length, 1001);
    removedScripts.truncateJsData(t);
    test.assertEqual(str, t.contents);

};

exports.addAScriptInline = function(test) {
    var jsString = 'var b = document.createElement("script");';
    var script = {inline:true, contents: jsString, removalReason: 'creates a script element.'};
    test.assertEqual(script.contents, jsString);
    removedScripts.addAScript('http://www.example.org/', script);
    var fetchedScript = removedScripts.getScripts('http://www.example.org/');
    test.assert(fetchedScript);
    test.assertEqual(fetchedScript[0].contents, jsString);
};

exports.testAddAScriptTwice = function (test) {
    var jsString = 'var b = document.createElement("script");';
    var script = {inline:true, contents: jsString, removalReason: 'creates a script element.'};
    test.assertEqual(removedScripts.addAScript('http://www.example.org/', script), false);
};

exports.testIsFound = function (test) {
    var url = 'http://lduros.net/';
    var str = "http://www.lduros.net/assets/blah.js";
    var script = {inline:false, contents: str};
    removedScripts.addAScript('http://lduros.net/', script);
    test.assertEqual(removedScripts.isFound(url, script), true);
};

exports.testIsFoundHash = function (test) {
    var str = "var i = 0;";
    var hash = '1621f3b5cfc1c3753f347349677f53e82285a2f1';

    // Unline in test-all_scripts.js, we are not adding hash here.
    // The hash property should be added during addAScript execution.
    var obj = {'inline': true, 'contents': str};
    removedScripts.addAScript('http://example.com/', obj);
    test.assertEqual(removedScripts.scripts['http://example.com/'][removedScripts.scripts['http://example.com/'].length -1].hash, hash);
    test.assertEqual(removedScripts.isFound('http://example.com/', obj), true);
};
