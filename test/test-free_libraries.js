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
/*

forget this test for now.

var main = require("main");

var pageMod = require("sdk/page-mod");
var tabs = require("sdk/tabs");
var data = require("sdk/self").data;

exports.testFreeLibraryjQuery172 = function (test) {
    test.waitUntilDone();



    var mod = pageMod.PageMod({

	include: "data:*",

	contentScriptWhen: 'end',

	contentScript: 'self.postMessage(document.getElementsByTagName("script")[0].getAttribute("data-librejs"));',

	onAttach: function (worker) {
	    worker.on('message', function (message) {
			  console.log('message is', message);
		    test.assertEqual(message, 'accepted');
		    //test.done();
		    //mod.destroy();
	    });
	}
    });

    tabs.open("http://lduros.net/assets/librejs/tests/free-libraries/");

};
*/
