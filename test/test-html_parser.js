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

var htmlParser = require("../lib/html_script_finder/html_parser");

var {Cc, Ci, Cu, Cm, Cr} = require("chrome");


var htmlPageString = "<!doctype html><html><body class=\"home\">\n\n\n<!-- Start header -->\n    <header id=\"site-header\" class=\"container\">\n      <div class=\"site-title container\">\n	<div class=\"row\">\n	  <hgroup class=\"sixcol\">\n	    <a href=\"/\" class=\"logo\"><img src=\"/assets/images/template/logo.png\" alt=\"lduros.net\" title=\"lduros.net\"/></a>\n	    <h1>loïc duros</h1>\n	    <h2><span>Web Developer</span></h2>\n	  </hgroup>\n	</div>\n      </div>\n      <nav>\n	<div class=\"container\">\n	  <div class=\"row\">\n            <ul class=\"twelvecol\">\n            <li class=\"first\"><a href=\"/\" class=\"current\">Main</a></li>\n            <li><a href=\"/contact/\" class=\"\">Contact</a></li> \n            <li><a class=\"feed-button\" title=\"Atom Feed\" href=\"/posts/feed/\">Feed</a></li>\n	    </ul>	    \n	  </div>\n	</div>\n      </nav>\n    </header></html>";

var readResult = function (result) {
    var count = result.length;
    var str = {};
    var binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].
	createInstance(Ci.nsIBinaryInputStream);

    var converterInputStream = Cc["@mozilla.org/intl/converter-input-stream;1"]
        .createInstance(Ci.nsIConverterInputStream);
    converterInputStream.init(result.newInputStream(0), "UTF-8", count, "2");    
    for (var item in converterInputStream) {
        console.log(item);
    }
    converterInputStream.readString(count, str);
    return str.value;
};

