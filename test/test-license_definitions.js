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

const licenses = require('../lib/js_checker/license_definitions');


exports.testGetLicenseName = function (test) {
  for (var license in licenses.licenses) {
	  test.assert(licenses.licenses[license].licenseName);
  }
  test.done();
};

exports.testGetLicenseFragments = function (test) {
  for (var license in licenses.licenses) {
	  test.assert(licenses.licenses[license].licenseFragments);
  }
};

exports.testGetLicenseLicenseFragmentsElems = function (test) {
  var currentLicense;
  for (var license in licenses.licenses) {
	  currentLicense = licenses.licenses[license].licenseFragments;
	  for (var item in currentLicense) {
	    test.assert(currentLicense[item].text);
	    test.assert(currentLicense[item].type);
	  }
  }
};
