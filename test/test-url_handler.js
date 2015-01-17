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
const urlHandler = require('url_handler/url_handler');

exports.testRemoveFragment1 = function (test) {
    var url = 'http://example.org/blah.html#section';
    var result = urlHandler.removeFragment(url);
    test.assertEqual(result, 'http://example.org/blah.html');
};

exports.testRemoveFragmentWithQueryString = function (test) {
    // test for the Amazon Track Package related bug.
    var url = 'http://example.org/blah.html?q=something#section';
    var result = urlHandler.removeFragment(url);
    test.assertEqual(result, 'http://example.org/blah.html?q=something');
};

exports.testQueryString = function (test) {
    // test for the Amazon Track Package related bug.
    var url = 'http://example.org/blah.html';
    var t = urlHandler.parse(url);
    t.search = 'librejs=contact';
    console.log(JSON.stringify(t));
    test.assertEqual(t.search, 'librejs=contact');
    test.assertEqual(urlHandler.format(t), 'http://example.org/blah.html?librejs=contact');
};

exports.testAddQuery = function (test) {
    // test for the Amazon Track Package related bug.
    var url = 'http://example.org/blah.html?t=1';
    var t = urlHandler.addQuery(url, 'librejs=contact');
    test.assertEqual(t, 'http://example.org/blah.html?t=1&librejs=contact');
};

exports.testAddQueryWithFragment = function (test) {
    // test for the Amazon Track Package related bug.
    var url = 'http://example.org/blah.html?t=1#topic1';
    var t = urlHandler.addQuery(url, 'librejs=contact');
    test.assertEqual(t, 'http://example.org/blah.html?t=1&librejs=contact#topic1');
};

exports.testGetHostname = function (test) {
    var url = 'http://example.org/some-site.html';
    test.assertEqual(urlHandler.getHostname(url), 'example.org');
};

exports.testGetHostnameWithWWW = function (test) {
    var url = 'http://www.example.org/some-site.html';
    test.assertEqual(urlHandler.getHostname(url), 'www.example.org');
};

exports.testGetHostnameWithWWW2 = function (test) {
    var url = 'http://www.lduros.net/somepage.html';
    test.assertEqual(urlHandler.getHostname(url), 'www.lduros.net');
};

exports.testDONOTHaveSameHostname = function (test) {
    var url1 = 'http://marcotempest.com/screen/PublicContactStartV3/language/en#librejs=true';
    var url2 = 'http://www.google.com/search?hl=en&output=search&sclient=psy-ab&q=marco+tempest&btnG=';
    test.assertEqual(urlHandler.haveSameHostname(url1, url2), false);
};
