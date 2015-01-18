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

var main = require('main');
var tabs = require('sdk/tabs');

/*exports.testBug = function (assert, done) {
    var tab = tabs.open('http://www.yahoo.com');
    //var tab2 = tabs.open('about:home');
    //tab.activate();
    tabs.on('ready', function (tab) {
        if (tab.url == 'http://www.yahoo.com') {
            tab.url = 'http://messenger.yahoo.com/';
        } else {
            tabs.activeTab.attach({contentScript:
                "window.history.back();" 
            });
            require("sdk/timers").setTimeout(function () { 
                assert.ok(true);
                done();
            }, 2000);
            //tab.close();
        }
    });
};*/

//require('sdk/test').run(exports);
