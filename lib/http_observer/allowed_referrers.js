/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
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

var prefChange = require("addon_management/prefchange");

var allowed = {};

/**
 * Contains a list of pages that are allowed
 * to execute JavaScript regardless of whether it is
 * nonfree and nontrivial.
 */
var AllowedReferrers = function() {
};

AllowedReferrers.prototype.addPage = function(url) {
    allowed[url] = 1;
};

AllowedReferrers.prototype.urlInAllowedReferrers = function (url) {
	if (allowed[url] === 1) {
	    return true;
	}
	// check if whitelisted.
	return this.urlInWhitelist(url);
};

AllowedReferrers.prototype.urlInWhitelist = function(url) {
	var whitelist = prefChange.getWhitelist();
	var i = 0, le = whitelist.length;
	for (; i < le; i++) {
	    if (whitelist[i].test(url)) {
		    return true;
	    }
	}
};

AllowedReferrers.prototype.clearSinglePageEntry = function(url) {
	var index = allowed[url];

	if (allowed[url] === 1) {
	    delete allowed[url];
	}
};

AllowedReferrers.prototype.clearAllEntries = function() {
	allowed = {};
};

exports.allowedReferrers = new AllowedReferrers();
