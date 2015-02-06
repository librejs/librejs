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

const allowedRef = require('http_observer/allowed_referrers').allowedReferrers;

var addUrls = function () {
    allowedRef.addPage('http://www.example.org');
    allowedRef.addPage('http://www.fsf.org');
    allowedRef.addPage('http://www.debian.org');
    allowedRef.addPage('http://lduros.net');
};

// FIXME
/*exports.testAddPage = function (test) {
    allowedRef.clearAllEntries();
    addUrls();
    test.assertEqual(allowedRef.allowed['http://www.example.org'], 1);
};*/

exports.testCheckUrlInArray = function (test) {
    allowedRef.clearAllEntries();
    addUrls();
    test.assertEqual(true, allowedRef.urlInAllowedReferrers('http://lduros.net'));
};

exports.testCheckUrlNotInArray = function (test) {
    allowedRef.clearAllEntries();
    addUrls();
    test.assertEqual(undefined, allowedRef.urlInAllowedReferrers('http://lemonde.fr'));    
};

exports.testClearSinglePageEntry = function (test) {
    allowedRef.clearAllEntries();
    addUrls();
    test.assertEqual(true, allowedRef.urlInAllowedReferrers('http://www.fsf.org'));
    allowedRef.clearSinglePageEntry('http://www.fsf.org');
    test.assertEqual(undefined, allowedRef.urlInAllowedReferrers('http://www.fsf.org'));
};
