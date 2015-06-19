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

var xhr2 = require("../lib/html_script_finder/dom_handler/request");
var Request = require("sdk/request").Request;

exports.testHttpsEverywhere = function (test) {

    test.waitUntilDone();

    var script = {url: 'https://static.fsf.org/nosvn/appeal2011/widget.js'};

    var callback = function (script, text) {
	//console.log('response received', text);
	test.assert(true);
	test.done();
    };
    
    var req = xhr2.request(script, callback);
    
    req.request();
    
};

exports.testXhr = function (test) {

    // async.
    test.waitUntilDone();

    var script = {url: 'http://lduros.net/assets/js/prettify/prettify.js'};

    var callback = function (script, text) {
	
	//console.log('response received', text);
	test.assert(true);
	test.done();
    };
    
    var req = xhr2.request(script, callback);

    req.request();

};

exports.testXhr2 = function (test) {

    // async.
    test.waitUntilDone();

    var script = {url: 'http://www.fsf.org/graphics/widget/global/widget.js'};

    var callback = function (script, text) {
	
	//console.log('response received', text);
	test.assert(true);
	test.done();
    };
    
    var req = xhr2.request(script, callback);

    req.request();

};

exports.testCompareXhr2WithSDKRequest = function (test) {

    test.waitUntilDone();

    var url = 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js';

    Request({
		'url': url,
		'onComplete': function (response) {
		    console.log('first response received');
		    var script = {'url':  url};
            var callback = function(script, text) {
                test.assertEqual(response.text, text);
                test.done();
            };

		    var req = xhr2.request(script, callback);
		    req.request();
		}
    }).get();
};
