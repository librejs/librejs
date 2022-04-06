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

const { licenses } = require('./license_definitions.js');
const { patternUtils } = require('./pattern_utils.js');

const licStartLicEndRe = /@licstartThefollowingistheentirelicensenoticefortheJavaScriptcodeinthis(?:page|file)(.*)?@licendTheaboveistheentirelicensenoticefortheJavaScriptcodeinthis(?:page|file)/mi;


/**
 * stripLicenseToRegexp
 *
 * Removes all non-alphanumeric characters except for the 
 * special tokens, and replace the text values that are 
 * hardcoded in license_definitions.js
 *
 */
const stripLicenseToRegexp = function(license) {
  for (const frag of license.licenseFragments) {
    frag.regex = patternUtils.removeNonalpha(frag.text);
    frag.regex = new RegExp(
      patternUtils.replaceTokens(frag.regex), '');
  }
};

const init = function() {
  console.log('initializing regexes');
  for (const key in licenses) {
    stripLicenseToRegexp(licenses[key]);
  }
}

module.exports.init = init;

/**
*
*	Takes in the declaration that has been preprocessed and 
*	tests it against regexes in our table.
*/
const searchTable = function(strippedComment) {
  const stripped = patternUtils.removeNonalpha(strippedComment);
  // looking up license
  for (const key in licenses) {
    const license = licenses[key];
    for (const frag of license.licenseFragments) {
      if (frag.regex.test(stripped)) {
        return license.licenseName;
      }
    }
  }
  console.log('No global license found.');
  return false;

}

/**
*	Takes the "first comment available on the page"
*	returns true for "free" and false for anything else	
*/
const check = function(licenseText) {
  if (licenseText === undefined || licenseText === null || licenseText == '') {
    // not an inline script
    return false;
  }
  // remove whitespace
  const stripped = patternUtils.removeWhitespace(licenseText);
  // Search for @licstart/@licend
  // This assumes that there isn't anything before the comment
  const matches = stripped.match(licStartLicEndRe);
  if (matches == null) {
    return false;
  }
  return searchTable(matches[0]);
};

module.exports.check = check;
