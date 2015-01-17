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
 *
 */

var {Cc, Ci, Cu, Cm, Cr} = require("chrome");

    var htmlText = "<!doctype html><html><head></head><body><script>document.write('<div id=\'jsparsed\'>JS-only content</div>');</script><div id=\'regularDiv\'></div></body></html>";


exports.testDOMParserNotParsingJS = function (test) {
        
    var domParser = Cc["@mozilla.org/xmlextras/domparser;1"].
		createInstance(Ci.nsIDOMParser);
    var dom = domParser.parseFromString(htmlText, "text/html");
   
    test.assert(!dom.getElementById("jsparsed"));
    test.assert(dom.getElementById("regularDiv"));

};
