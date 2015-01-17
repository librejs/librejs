/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2014 Loic J. Duros
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

const {Cc,Ci} = require('chrome');
var parser = Cc["@mozilla.org/xmlextras/domparser;1"]
    .createInstance(Ci.nsIDOMParser);

var WebLabelFinder = require('html_script_finder/web_labels/js_web_labels')
    .WebLabelFinder;

exports.testSearchForJsLinkEmpty = function (assert) {
    var finder = new WebLabelFinder();
    var doc = parser.parseFromString('<html></html>', 'text/html');
    finder.init(doc, 'http://www.rootstrikers.org', function() {});
    assert.strictEqual(finder.searchForJsLink(), false);
};

exports.testSearchForJsLinkJsLicense = function (assert) {
    var finder = new WebLabelFinder();
    var doc = parser.parseFromString(
        '<html><body>' +
            '<a href="lic.html" rel="jslicense">JavaScript License Info</a>' +
            '</body></html>', 'text/html');
    finder.init(doc, 'http://www.rootstrikers.org', function() {});

    assert.strictEqual(
        finder.searchForJsLink(),
        'http://www.rootstrikers.org/lic.html#librejs=true'
    );
};

exports.testSearchForJsLinkDataJsLicense = function (assert) {
    var finder = new WebLabelFinder();
    var doc = parser.parseFromString(
        '<html><body>' +
            '<a href="lic.html" data-jslicense="1">JavaScript License</a>' +
            '</body></html>', 'text/html');
    finder.init(doc, 'http://www.rootstrikers.org', function() {});

    assert.strictEqual(
        finder.searchForJsLink(),
        'http://www.rootstrikers.org/lic.html#librejs=true'
    );
};

exports.testIsLicenseFreeEmpty = function(assert) {
    var finder = new WebLabelFinder();
    // listCheck is initialized by WebLabelFinder.matchListWithDefs...
    // I'm initializing it here to prevent errors when testing.
    finder.listCheck = {};

    var lic = {
        licenses: []
    };
    var licArray = [];
    var jslicenseURL = null;
    var callback = function() { };
    assert.strictEqual(
        finder.isLicenseFree(lic, licArray, jslicenseURL, callback),
        false,
        'A script with no license info is considered nonfree'
    );
};

exports.testIsLicenseFree1 = function(assert) {
    var finder = new WebLabelFinder();
    finder.listCheck = {};

    var lic = {
        'fileName': 'filepicker.js',
        'fileUrl': 'http://www.rootstrikers.org/vendor/filepicker.js',
        'fileHash': null,
        'licenses': [{
            'licenseName': 'Expat',
            'licenseUrl': 'http://www.jclark.com/xml/copying.txt'
        }],
        'sources':[{
            'sourceName': 'filepicker.js',
            'sourceUrl': 'http://www.rootstrikers.org/vendor/filepicker.js'
        }]
    };
    var licArray = [];
    var jslicenseURL = null;
    var callback = function() { };
    assert.strictEqual(
        finder.isLicenseFree(lic, licArray, jslicenseURL, callback),
        true,
        'A script with one free license is considered free'
    );
};

exports.testIsLicenseFree3 = function(assert) {
    var finder = new WebLabelFinder();
    finder.listCheck = {};

    var lic = {
        'fileName': 'all.min.js',
        'fileUrl': 'http://example.com/all.min.js',
        'fileHash': null,
        'licenses': [
            {
                'licenseName': 'GNU-GPL-3.0',
                'licenseUrl': 'http://www.gnu.org/licenses/gpl-3.0.html'
            },
            {
                'licenseName': 'Expat',
                'licenseUrl': 'http://www.jclark.com/xml/copying.txt'
            },
            {
                'licenseName': 'MPL-2.0',
                'licenseUrl': 'http://www.mozilla.org/MPL/2.0'
            }
        ],
        'sources':[
            {
                'sourceName': 'gpl3.js',
                'sourceUrl': 'http://www.example.com/gpl3.js'
            },
            {
                'sourceName': 'expat.js',
                'sourceUrl': 'http://www.example.com/expat.js'
            },
            {
                'sourceName': 'mpl.js',
                'sourceUrl': 'http://www.example.com/mpl.js'
            }
        ]
    };
    var licArray = [];
    var jslicenseURL = null;
    var callback = function() { };
    assert.strictEqual(
        finder.isLicenseFree(lic, licArray, jslicenseURL, callback),
        true,
        'A script with three free licenses is considered free'
    );
};

exports.testIsLicenseNotFree = function(assert) {
    var finder = new WebLabelFinder();
    finder.listCheck = {};

    var lic = {
        'fileName': 'filepicker.js',
        'fileUrl': 'http://www.rootstrikers.org/vendor/filepicker.js',
        'fileHash': null,
        'licenses': [
            {
                'licenseName': 'Expat',
                'licenseUrl': 'http://www.jclark.com/xml/copying.txt'
            },
            {
                'licenseName': 'Some-Unrecognized-License',
                'licenseUrl': 'http://www.example.com/nolicense.txt'
            }
        ],
        'sources':[
            {
                'sourceName': 'filepicker.js',
                'sourceUrl': 'http://www.rootstrikers.org/vendor/filepicker.js'
            },
            {
                'sourceName': 'nonfree.js',
                'sourceUrl': 'http://www.example.com/nonfree.js'
            }
        ]
    };
    var licArray = [];
    var jslicenseURL = null;
    var callback = function() { };
    assert.strictEqual(
        finder.isLicenseFree(lic, licArray, jslicenseURL, callback),
        false,
        'A script with one free license and one nonfree is considered nonfree'
    );
};

require('sdk/test').run(exports);
