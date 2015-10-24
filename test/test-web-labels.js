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

var mockLicenseList = [{
    'fileName': 'jquery.min.js',
    'fileUrl': 'http://www.rootstrikers.org/bower_components/jquery/dist/jquery.min.js',
    'fileHash': null,
    'licenseName': 'Expat',
    'licenseUrl': 'http://www.jclark.com/xml/copying.txt',
    'free': true
}];

var dom_handler = require('../lib/html_script_finder/dom_handler');

exports.testScriptHasJsWebLabel = function (assert) {
    var dm = new dom_handler.DomHandler();
    dm.licenseList = mockLicenseList;
    dm.pageURL = 'http://rootstrikers.org/';
    var script = {
        'src': 'http://www.rootstrikers.org/bower_components/jquery/dist/jquery.min.js'
    };
    assert.ok(dm.scriptHasJsWebLabel(script));
};

require('sdk/test').run(exports);
