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

/*
 * FIXME: This test relies on the cors-test2.html file (visible in bzr
 * history), which in turn relies on an external PHP script that isn't around
 * anymore. Because of this, I'm commenting out this test for now.
 */

/*
var pageMod = require("sdk/page-mod");
var tabs = require("sdk/tabs");
var data = require("sdk/self").data;

exports.testCORS = function (test) { 
    test.waitUntilDone();

    var mod = pageMod.PageMod({
        include: /.*cors-test2.html/,
        contentScriptWhen: 'end',

        contentScript: "window.setTimeout(function () { " + 
            "var content = document.getElementById(\"cross\").innerHTML;" + 
            "if (/snippet/.test(content)) {" +
            "self.postMessage(\"Done!\");} " +
            "}, 5000); ",

        onAttach: function (worker) {
            worker.on('message', function (message) {
                console.log("CORS bug test page fully loaded");

                if (message === 'Done!') {
                    test.assertEqual(true, true);
                    test.done();
                    mod.destroy();
                }
            });
        }
    });

    tabs.open(data.url("test/cors-test2.html"));
};
*/
