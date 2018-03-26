/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
* *
* Copyright (C) 2018 Nathan Nichols
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

var data = require("./license_definitions.js");
var match_utils = require("./pattern_utils.js").patternUtils;

var licStartLicEndRe = /@licstartThefollowingistheentirelicensenoticefortheJavaScriptcodeinthis(?:page|file)(.*)?@licendTheaboveistheentirelicensenoticefortheJavaScriptcodeinthis(?:page|file)/mi;


/**
 * stripLicenseToRegexp
 *
 * Removes all non-alphanumeric characters except for the 
 * special tokens, and replace the text values that are 
 * hardcoded in license_definitions.js
 *
 */
var stripLicenseToRegexp = function (license) {
	var max = license.licenseFragments.length;
	var item;
	for (var i = 0; i < max; i++) {
		item = license.licenseFragments[i];
		item.regex = match_utils.removeNonalpha(item.text);
		item.regex = new RegExp(
			match_utils.replaceTokens(item.regex), 'g'); 
	}
	return license;
};

var	license_regexes = [];

var init = function(){
	console.log("initializing regexes");
	for (var item in data.licenses) {
		license_regexes.push(stripLicenseToRegexp(data.licenses[item]));
	}
	//console.log(license_regexes);
}

module.exports.init = init;

/**
*
*	Takes in the declaration that has been preprocessed and 
*	tests it against regexes in our table.
*/
var search_table = function(stripped_comment){
	var stripped = match_utils.removeNonalpha(stripped_comment); 
	//stripped = stripped.replaceTokens(stripped_comment); 

	//console.log("Looking up license");
	//console.log(stripped);

    for (license in data.licenses) {	    
		frag = data.licenses[license].licenseFragments;
		max_i = data.licenses[license].licenseFragments.length;
		for (i = 0; i < max_i; i++) {
		    if (frag[i].regex.test(stripped)) {
				console.log(data.licenses[license].licenseName);
		       	return true;
		    }
		}
	}	
	console.log("No license found.");
	return false;

}

/**
*	Takes the "first comment available on the page"
*	returns true for "free" and false for anything else	
*/
var check = function(license_text){
	//console.log("checking...");
	//console.log(license_text);

	if(license_text === undefined || license_text === null || license_text == ""){
		//console.log("Was not an inline script");
		return false;
	}
	// remove whitespace
	var stripped = match_utils.removeWhitespace(license_text);
	// Search for @licstart/@licend
	// This assumes that there isn't anything before the comment
	var matches = stripped.match(licStartLicEndRe);
	if(matches == null){
		return false;
	}
	var declaration = matches[0];

	return search_table(declaration);

};

module.exports.check = check;
