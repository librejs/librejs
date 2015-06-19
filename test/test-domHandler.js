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

// these tests require Firefox 11 or later
// using following command to run after placing nightly is /usr/local/: 
// cfx --binary=/usr/local/bin/firefox-nightly test -f domHandler

var domHandler = require("../lib/html_script_finder/dom_handler");
var mockDom = require("./mock/mock_dom");

//var loader = test.makeSandboxedLoader();
// access private objects from module.
//var privateScope = loader.findSandboxForModule("html_script_finder/dom_handler").globalScope;

exports.testAcceptedScriptAttribute = function (assert, done) {
    var document = mockDom.acceptedScriptsDocument();
    domHandler.domHandler(
        document, 
        'http://example.org/test.html',
        null,
        null,
        function (dom) {
            assert.equal(
                document.getElementsByTagName('script')[0]
                    .getAttribute('data-librejs'),
                'accepted');
            assert.equal(
                document.getElementsByTagName('script')[1]
                    .getAttribute('data-librejs'),
                'accepted');
            done();
        }
    );
};

exports.testDomWithOnAttrib = function (assert, done) {
    var document = mockDom.domWithOnAttrib();

    domHandler.domHandler (
        document,
        'http://example.org/test.html',
        null,
        null,
        function (dom) {
            assert.equal(
                document.getElementsByTagName('body')[0]
                    .getAttribute('data-librejs'),
                'accepted');
            done();
        }
    );
};

require('sdk/test').run(exports);
