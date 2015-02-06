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

var pageMod = require("sdk/page-mod");
var tabs = require("sdk/tabs");
var data = require("sdk/self").data;

// FIXME
/*exports.testDetectEmailAddressFound = function (test) {
    test.waitUntilDone();
    
    var mod = pageMod.PageMod({
	include: "data:*",
	contentScriptWhen: 'end',

	contentScriptFile: [data.url('complain/contact_regex.js'),
			    data.url('complain/link_types.js'),
			    data.url('settings/third-party/jquery/jquery.min.js'), 
			    data.url('complain/contact_finder.js')],

	contentScript: "contactFinder.init(true); contactFinder.searchForContactLink('http://example.org/'); console.log('link', document.getElementsByTagName('a')[0].href)",
	
	onAttach: function (worker) {
	    worker.on('message', function (message) {
		console.log('event is', message.event);
		if (message.event === 'certainEmailAddressFound') {
		    test.assertEqual(true, true);
		    mod.destroy();
		    test.done();

		}
	    });
	}

    });

    tabs.open("data:text/html;charset=utf-8,<!doctype html>%0D%0A<html>%0D%0A<head><script type='librejs/blocked'>var num %3D 5%3B<%2Fscript><%2Fhead>%0D%0A%0D%0A<body><h1 id='test'>Test<%2Fh1><a href=\"mailto:webmaster@example.org\">Contact</a><%2Fbody><%2Fhtml>");

};*/

// FIXME
/*exports.testDetectEmailAddressFoundTwoLinks = function (test) {
    test.waitUntilDone();
    
    var mod = pageMod.PageMod({
	include: "data:*",
	contentScriptWhen: 'end',

	contentScriptFile: [data.url('complain/contact_regex.js'),
			    data.url('complain/link_types.js'),
			    data.url('settings/third-party/jquery/jquery.min.js'), 
			    data.url('complain/contact_finder.js')],


	contentScript: "contactFinder.init(true); contactFinder.searchForContactLink('http://example.org/'); console.log('link', document.getElementsByTagName('a')[0].href)",
	
	onAttach: function (worker) {
	    worker.on('message', function (message) {
		console.log('event is', message.event);
		if (message.event === 'certainEmailAddressFound') {
		    test.assert(true);
		    test.done();
		    mod.destroy();
		}
	    });
	}

    });

    tabs.open("data:text/html;charset=utf-8,<!doctype html>%0D%0A<html>%0D%0A<head><script type='librejs/blocked'>var num %3D 5%3B<%2Fscript><%2Fhead>%0D%0A%0D%0A<body><h1 id='test'>Test<%2Fh1><a href=\"blah\">Random Link</a><a href=\"mailto:webmaster@example.org\">Contact</a><a href=\"blah\">Random Link</a><%2Fbody><%2Fhtml>");

};*/


// FIXME
/*exports.testDetectEmailAddressNotDomain = function (test) {
    test.waitUntilDone();
    
    var mod = pageMod.PageMod({
	include: "data:*",
	contentScriptWhen: 'end',

	contentScriptFile: [data.url('complain/contact_regex.js'),
			    data.url('complain/link_types.js'),
			    data.url('settings/third-party/jquery/jquery.min.js'), 
			    data.url('complain/contact_finder.js')],

	contentScript: "contactFinder.init(true); contactFinder.searchForContactLink('http://example.org/'); console.log('link', document.getElementsByTagName('a')[0].href)",
	onAttach: function (worker) {
	    worker.on('message', function (message) {
		console.log('event is', message.event);
		if (message.event === 'uncertainEmailAddressFound') {
		    test.assert(true);
		    test.done();
		    mod.destroy();
		}
	    });
	}
    });

    tabs.open("data:text/html;charset=utf-8,<!doctype html>%0D%0A<html>%0D%0A<head><script type='librejs/blocked'>var num %3D 5%3B<%2Fscript><%2Fhead>%0D%0A%0D%0A<body><h1 id='test'>Test<%2Fh1><a href=\"mailto:webmaster@notsamedomain.org\">Contact</a><%2Fbody><%2Fhtml>");

};*/

// FIXME
/*exports.testCertainLink = function (test) {
    test.waitUntilDone();
    
    var mod = pageMod.PageMod({
	include: "data:*",
	contentScriptWhen: 'end',

	contentScriptFile: [data.url('complain/contact_regex.js'),
			    data.url('complain/link_types.js'),
			    data.url('settings/third-party/jquery/jquery.min.js'), 
			    data.url('complain/contact_finder.js')],

	contentScript: "contactFinder.init(true); contactFinder.searchForContactLink('http://example.org/'); console.log('link', document.getElementsByTagName('a')[0].href)",
	onAttach: function (worker) {
	    worker.on('message', function (message) {
		console.log('event is', message.event);
		if (message.event === 'certainLinkFound') {
		    test.assert(true);
		    test.done();
		    mod.destroy();
		}
	    });
	}
    });

    tabs.open("data:text/html;charset=utf-8,<!doctype html>%0D%0A<html>%0D%0A<head><script type='librejs/blocked'>var num %3D 5%3B<%2Fscript><%2Fhead>%0D%0A%0D%0A<body><h1 id='test'>Test<%2Fh1><a href=\"somelink.html\">some link</a><a href=\"http://example.org/contact.html\">Contact Us</a><%2Fbody><%2Fhtml>");

};*/
/*
exports.testCertainReal = function (test) {
    test.waitUntilDone();
    
    var mod = pageMod.PageMod({
	include: "*",
	contentScriptWhen: 'end',

	contentScriptFile: [data.url('complain/contact_regex.js'),
			    data.url('complain/link_types.js'),
			    data.url('settings/third-party/jquery/jquery.min.js'), 
			    data.url('complain/contact_finder.js')],

	contentScript: "contactFinder.init(true); contactFinder.searchForContactLink('http://lduros.net'); console.log('link', document.getElementsByTagName('a')[0].href)",
	onAttach: function (worker) {
	    worker.on('message', function (message) {
		console.log('event is', message.event);
		if (message.event === 'certainLinkFound') {
		    test.assert(true);
		    test.done();
		    mod.destroy();
		}
	    });
	}
    });

    tabs.open("http://lduros.net/");

};
*/

/* FIXME
exports.testCertainFeedbackAsPageWorker = function (test) {
    test.waitUntilDone();
    
    var mod = pageMod.PageMod({
	include: "*",
	contentScriptWhen: 'end',

	contentScriptFile: [data.url('complain/contact_regex.js'),
			    data.url('complain/link_types.js'),
			    data.url('settings/third-party/jquery/jquery.min.js'), 
			    data.url('complain/contact_finder.js')],

	contentScript: "contactFinder.init(true); contactFinder.searchForContactLink('http://lduros.net/assets/librejs/tests/contact-tests/'); console.log('link', document.getElementsByTagName('a')[0].href)",

	onAttach: function (worker) {

	    worker.on('message', function (message) {

		console.log('event is', message.event);
			  console.log("We've got a certainLinkFound!");
		if (message.event === 'certainLinkFound') {

		    test.assert(true);
		    test.done();
		    mod.destroy();
		}

	    });
	}
    });

    tabs.open("http://lduros.net/assets/librejs/tests/contact-tests/");

};*/



