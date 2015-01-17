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

var pageMod = require("sdk/page-mod");
var tabs = require("sdk/tabs");
var data = require("sdk/self").data;

exports.testScriptsFetched = function (test) {
    test.waitUntilDone();
    
    var mod = pageMod.PageMod({
	include: "data:*",
	contentScriptWhen: 'end',
	contentScriptFile: [data.url('settings/third-party/jquery/jquery.min.js'), 
			    data.url('complain/contact_finder.js'),
			    data.url('complain/pagemod_finder.js'),
			    data.url('script_detector/script_detector.js')],
	contentScript: "scriptDetector.init();",
	onAttach: function (worker) {
	    worker.on('message', function (message) {
		if (message.event === 'scriptsFetched') {
		    test.assertEqual(message.value.blocked[0].contents, "var num = 5;");
		    test.assertEqual(message.value.blocked[0].inline, true);
		    test.done();
		}
	    });
	}
    });

    tabs.open("data:text/html;charset=utf-8,<!doctype html>%0D%0A<html>%0D%0A<head><script type='librejs/blocked'>var num %3D 5%3B<%2Fscript><%2Fhead>%0D%0A%0D%0A<body><h1 id='test'>Test<%2Fh1><a href='contact.html'>contact</a><%2Fbody><%2Fhtml>");

};
