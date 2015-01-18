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
var crypto = require("script_entries/crypto");
var longString = require("./mock/long_string.js").longString;
var Request = require("sdk/request").Request;
var cRequest = require("html_script_finder/dom_handler/request");

exports.testSha1EncryptTest = function(assert) {
    var str = "This is my test string";
    assert.equal(crypto.sha1Encrypt(str), 'e925bfd93e14174c2b2c83f68b3d3243df3005ef');
};

exports.testSha1EncryptjQueryTest = function(assert, done) {
    var request = Request({
        'url': 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js'
    });
    request.on('complete', function(response) {
        assert.equal(response.status, 200);
        assert.equal(crypto.sha1Encrypt(response.text),
            'd6c1f41972de07b09bfa63d2e50f9ab41ec372bd');
        done();
    });
    request.get();
};

require('sdk/test').run(exports);
