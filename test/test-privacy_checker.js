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

const privacyCheck = require("js_checker/privacy_checker").privacyCheck;

exports.testPrivacyCheckerGoogleAnalyticsRegex = function(assert) {
    // original analytics code this was designed for
    var scriptText =
        "var _gaq = _gaq || [];\n" +
        "_gaq.push(['_setAccount', 'UA-5555555-1']);\n" +
        "_gaq.push(['_trackPageview']);\n" +
        "\n" +
        "(function() {\n" +
        "var ga = document.createElement('script'); ga.type = " +
        "'text/javascript'; ga.async = true;\n" +
        "ga.src = ('https:' == document.location.protocol ? 'https://ssl'" +
        " : 'http://www') + '.google-analytics.com/ga.js';\n" +
        "var s = document.getElementsByTagName('script')[0]; " +
        "s.parentNode.insertBefore(ga, s);\n" +
        "})();";
    var check = privacyCheck.checkScriptPrivacyThreat(scriptText);
    assert.equal(check, true, 'regex recognizes old GA code');

    // newer analytics code
    scriptText =
        "var _gaq = _gaq || [];\n" +
        "_gaq.push(['_setAccount', 'UA-5555555-2']);\n" +
        "\n" +
        "(function() {\n" +
        "  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;\n" +
        "  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';\n" +
        "  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);\n" +
        "})();";
    check = privacyCheck.checkScriptPrivacyThreat(scriptText);
    assert.equal(check, true, 'regex recognizes new GA code');
};

require('sdk/test').run(exports);
