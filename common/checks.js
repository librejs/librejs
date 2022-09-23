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

const acorn = require('acorn');
const { licenses } = require('./license_definitions.js');
const { patternUtils } = require('./pattern_utils.js');
const { makeDebugLogger } = require('./debug.js');
const fnameData = require('./fname_data.json').fname_data;

const LIC_RE = /@licstartThefollowingistheentirelicensenoticefortheJavaScriptcodeinthis(?:page|file)(.*)?@licendTheaboveistheentirelicensenoticefortheJavaScriptcodeinthis(?:page|file)/mi;

/*
  NONTRIVIAL THINGS:
  - Fetch
  - XMLhttpRequest
  - eval()
  - ?
  JAVASCRIPT CAN BE FOUND IN:
  - Event handlers (onclick, onload, onsubmit, etc.)
  - <script>JS</script>
  - <script src="/JS.js"></script>
  WAYS TO DETERMINE PASS/FAIL:
  - "// @license [magnet link] [identifier]" then "// @license-end" (may also use /* comments)
  - Automatic whitelist: (http://bzr.savannah.gnu.org/lh/librejs/dev/annotate/head:/data/script_libraries/script-libraries.json_
*/
// These are objects that it will search for in an initial regex pass over non-free scripts.
const RESERVED_OBJECTS = [
  //"document",
  //"window",
  'fetch',
  'XMLHttpRequest',
  'chrome', // only on chrome
  'browser', // only on firefox
  'eval'
];
const LOOPKEYS = new Set(['for', 'if', 'while', 'switch']);
const OPERATORS = new Set(['||', '&&', '=', '==', '++', '--', '+=', '-=', '*']);
// @license match, second and third capture groups are canonicalUrl
// and license name
const OPENING_LICENSE_RE = /\/[/*]\s*?(@license)\s+(\S+)\s+(\S+).*$/mi;
const CLOSING_LICENSE_RE = /\/([*/])\s*@license-end\s*(\*\/)?/mi;
/**
*	If this is true, it evaluates entire scripts instead of returning as soon as it encounters a violation.
*
*	Also, it controls whether or not this part of the code logs to the console.
*
*/
const DEBUG = false; // debug the JS evaluation
const PRINT_DEBUG = false;
const dbg_print = makeDebugLogger('checks.js', PRINT_DEBUG, Date.now());

/**
 * stripLicenseToRegexp
 *
 * Removes all non-alphanumeric characters except for the 
 * special tokens, and replace the text values that are 
 * hardcoded in license_definitions.js.  Puts the result in
 * the regex field of the fragments.
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

/**
*
*	Takes in the declaration that has been preprocessed and 
*	tests it against regexes in licenses.
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
 * a @licstart .. @licend with a free license, returns the license name
 * if so, and null otherwise.
 */
const checkLicenseText = function(licenseText) {
  if (licenseText === undefined || licenseText === null) {
    return null;
  }
  // remove whitespace
  const stripped = patternUtils.removeWhitespace(licenseText);
  // Search for @licstart/@licend
  const matches = stripped.match(LIC_RE);
  return matches && searchTable(matches[0]);
};

//************************this part can be tested in the HTML file index.html's script test.js****************************

/**
 * Checks whether script is trivial by analysing its tokens.
 *
 * Returns an array of
 * [flag (boolean, true if trivial), reason (string, human readable report)].
 */
function fullEvaluate(script) {
  if (script === undefined || script == '') {
    return [true, 'Harmless null script'];
  }

  let tokens;

  try {
    tokens = acorn.tokenizer(script);
  } catch (e) {
    console.warn('Tokenizer could not be initiated (probably invalid code)');
    return [false, 'Tokenizer could not be initiated (probably invalid code)'];
  }
  try {
    var toke = tokens.getToken();
  } catch (e) {
    console.log(script);
    console.log(e);
    console.warn('couldn\'t get first token (probably invalid code)');
    console.warn('Continuing evaluation');
  }

  let amtloops = 0;
  let definesFunctions = false;

  /**
  * Given the end of an identifer token, it tests for parentheses
  */
  function is_bsn(end) {
    let i = 0;
    while (script.charAt(end + i).match(/\s/g) !== null) {
      i++;
      if (i >= script.length - 1) {
        return false;
      }
    }
    return script.charAt(end + i) == '[';
  }

  function evaluateByTokenValue(toke) {
    const value = toke.value;
    if (OPERATORS.has(value)) {
      // It's just an operator. Javascript doesn't have operator overloading so it must be some
      // kind of primitive (I.e. a number)
    } else {
      const status = fnameData[value];
      if (status === true) { // is the identifier banned?
        dbg_print('%c NONTRIVIAL: nontrivial token: \'' + value + '\'', 'color:red');
        if (DEBUG == false) {
          return [false, 'NONTRIVIAL: nontrivial token: \'' + value + '\''];
        }
      } else if (status === false || status === undefined) {// is the identifier not banned or user defined?
        // Is there bracket suffix notation?
        if (is_bsn(toke.end)) {
          dbg_print('%c NONTRIVIAL: Bracket suffix notation on variable \'' + value + '\'', 'color:red');
          if (DEBUG == false) {
            return [false, '%c NONTRIVIAL: Bracket suffix notation on variable \'' + value + '\''];
          }
        }
      } else {
        dbg_print('trivial token:' + value);
      }
    }
    return [true, ''];
  }

  function evaluateByTokenTypeKeyword(keyword) {
    if (toke.type.keyword == 'function') {
      dbg_print('%c NOTICE: Function declaration.', 'color:green');
      definesFunctions = true;
    }

    if (LOOPKEYS.has(keyword)) {
      amtloops++;
      if (amtloops > 3) {
        dbg_print('%c NONTRIVIAL: Too many loops/conditionals.', 'color:red');
        if (DEBUG == false) {
          return [false, 'NONTRIVIAL: Too many loops/conditionals.'];
        }
      }
    }
    return [true, ''];
  }

  while (toke !== undefined && toke.type != acorn.tokTypes.eof) {
    if (toke.type.keyword !== undefined) {
      //dbg_print("Keyword:");
      //dbg_print(toke);

      // This type of loop detection ignores functional loop alternatives and ternary operators
      const tokeTypeRes = evaluateByTokenTypeKeyword(toke.type.keyword);
      if (tokeTypeRes[0] === false) {
        return tokeTypeRes;
      }
    } else if (toke.value !== undefined) {
      const tokeValRes = evaluateByTokenValue(toke);
      if (tokeValRes[0] === false) {
        return tokeValRes;
      }
    }
    // If not a keyword or an identifier it's some kind of operator, field parenthesis, brackets
    try {
      toke = tokens.getToken();
    } catch (e) {
      dbg_print('Denied script because it cannot be parsed.');
      return [false, 'NONTRIVIAL: Cannot be parsed. This could mean it is a 404 error.'];
    }
  }

  dbg_print('%cAppears to be trivial.', 'color:green;');
  if (definesFunctions === true)
    return [true, 'Script appears to be trivial but defines functions.'];
  else
    return [true, 'Script appears to be trivial.'];
}


//****************************************************************************************************
/**
*	This is the entry point for full code evaluation for triviality.
*
*	Performs the initial pass on code to see if it needs to be completely parsed
*
*	This can only determine if a script is bad, not if it's good
*
*	If it passes the intitial pass, it runs the full pass and returns the result

*	It returns an array of [flag (boolean, false if "bad"), reason (string, human readable report)]
*
*/
function evaluate(script, name) {
  const reservedResult = evaluateForReservedObj(script, name);
  if (reservedResult[0] === true) {
    dbg_print('%c pass', 'color:green;');
  } else {
    return reservedResult;
  }

  return fullEvaluate(script);
}

function evaluateForReservedObj(script, name) {
  function reservedObjectRegex(object) {
    const arithOperators = '\\+\\-\\*\\/\\%\\=';
    return new RegExp('(?:[^\\w\\d]|^|(?:' + arithOperators + '))' + object + '(?:\\s*?(?:[\\;\\,\\.\\(\\[])\\s*?)', 'g');
  }
  const mlComment = /\/\*([\s\S]+?)\*\//g;
  const ilComment = /\/\/.+/gm;
  const temp = script.replace(/'.+?'+/gm, '\'string\'').replace(/".+?"+/gm, '"string"').replace(mlComment, '').replace(ilComment, '');
  dbg_print('%c ------evaluation results for ' + name + '------', 'color:white');
  dbg_print('Script accesses reserved objects?');

  // 	This is where individual "passes" are made over the code
  for (const reserved of RESERVED_OBJECTS) {
    if (reservedObjectRegex(reserved).exec(temp) != null) {
      dbg_print('%c fail', 'color:red;');
      return [false, 'Script uses a reserved object (' + reserved + ')'];
    }
  }
  return [true, 'Reserved object not found.'];
}

/**
 * Checks whether url is the magnet link of a license.
 * 
 * Returns the licenseName if so, otherwise returns null.  If a key is
 * supplied, checks for the license with the key only.
 */
function checkMagnet(url, key = null) {
  const fixedUrl = url.replace(/&amp;/g, '&');
  // Match by magnet link
  const checkLicenseMagnet = license => {
    for (const cUrl of license.canonicalUrl) {
      if (cUrl.startsWith('magnet:') && fixedUrl === cUrl) {
        return licenses[key].licenseName;
      }
    }
    return null;
  }

  if (key) {
    try {
      return checkLicenseMagnet(licenses[key]);
    } catch (error) {
      return null;
    }
  } else {
    for (const key in licenses) {
      const result = checkLicenseMagnet(licenses[key]);
      if (result) return result;
    }
    return null;
  }
}


/**
 *
 *	Evaluates the content of a script for licenses and triviality
 * scriptSrc: content of the script; name: script name; external:
 * whether the script is external
 *
 *	Returns
 *	[
 *		true (accepted) or false (denied),
 *		edited content,
 *		reason text
 *	]
 */
function checkScriptSource(scriptSrc, name, external = false) {
  let inSrc = scriptSrc.trim();
  if (!inSrc) return [true, scriptSrc, 'Empty source.'];

  // Check for @licstart .. @licend method
  const license = checkLicenseText(scriptSrc);
  if (license) {
    return [true, scriptSrc, `Licensed under: ${license}`];
  }

  let outSrc = '';
  let reason = '';
  let partsDenied = false;
  let partsAccepted = false;

  function checkTriviality(s) {
    if (!patternUtils.removeJsComments(s).trim()) {
      return true; // empty, ignore it
    }
    const [trivial, message] = external ?
      [false, 'External script with no known license']
      : evaluate(s, name);
    if (trivial) {
      partsAccepted = true;
      outSrc += s;
    } else {
      partsDenied = true;
      if (s.startsWith('javascript:'))
        outSrc += `# LIBREJS BLOCKED: ${message}`;
      else
        outSrc += `/*\nLIBREJS BLOCKED: ${message}\n*/`;
    }
    reason += `\n${message}`;
  }

  // Consume inSrc by checking licenses in all @license / @license-end
  // blocks and triviality outside these blocks
  while (inSrc) {
    const openingMatch = OPENING_LICENSE_RE.exec(inSrc);
    const openingIndex = openingMatch ? openingMatch.index : inSrc.length;
    // checks the triviality of the code before the license tag, if any
    checkTriviality(inSrc.substring(0, openingIndex));
    inSrc = inSrc.substring(openingIndex);
    if (!inSrc) break;

    // checks the remaining part, that starts with an @license
    const closureMatch = CLOSING_LICENSE_RE.exec(inSrc);
    if (!closureMatch) {
      const msg = 'ERROR: @license with no @license-end';
      return [false, `\n/*\n ${msg} \n*/\n`, msg];
    }
    let closureEndIndex = closureMatch.index + closureMatch[0].length;
    const commentEndOffset = inSrc.substring(closureEndIndex).indexOf(closureMatch[1] === '*' ? '*/' : '\n');
    if (commentEndOffset !== -1) {
      closureEndIndex += commentEndOffset;
    }

    if (!(Array.isArray(openingMatch) && openingMatch.length >= 4)) {
      return [false, 'Malformed or unrecognized license tag.'];
    }
    const licenseName = checkMagnet(openingMatch[2]);
    let message;
    if (licenseName) {
      outSrc += inSrc.substr(0, closureEndIndex);
      partsAccepted = true;
      message = `Recognized license: "${licenseName}".`
    } else {
      outSrc += `\n/*\n${message}\n*/\n`;
      partsDenied = true;
      message = `Unrecognized license tag: "${openingMatch[0]}"`;
    }
    reason += `\n${message}`;

    // trim off everything we just evaluated
    inSrc = inSrc.substring(closureEndIndex).trim();
  }

  if (partsDenied) {
    if (partsAccepted) {
      reason = `Some parts of the script have been disabled (check the source for details).\n^--- ${reason}`;
    }
    return [false, outSrc, reason];
  }

  return [true, scriptSrc, reason];
}

module.exports = { init, checkLicenseText, checkMagnet, checkScriptSource };
