/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
* *
* Copyright (C) 2018 Nathan Nichols
* Copyright (C) 2022 Yuchen Pei
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

const LIC_RE = /@licstartThefollowingistheentirelicensenoticefortheJavaScriptcodeinthis(?:page|file)(.*)?@licendTheaboveistheentirelicensenoticefortheJavaScriptcodeinthis(?:page|file)/mi;


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
  return null;
}

/**
 * Checks whether licenseText, modulo whitespace, starts with
 * a @licstart / @licend with a free license, returns the license name
 * if so, and null otherwise.
 */
const check = function(licenseText) {
  if (licenseText === undefined || licenseText === null) {
    return null;
  }
  // remove whitespace
  const stripped = patternUtils.removeWhitespace(licenseText);
  // Search for @licstart/@licend
  const matches = stripped.match(LIC_RE);
  return matches && searchTable(matches[0]);
};

module.exports.check = check;
