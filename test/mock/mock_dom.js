/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012 Loic J. Duros
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

var {Cc, Ci, Cu, Cm, Cr} = require("chrome");

var parser = Cc["@mozilla.org/xmlextras/domparser;1"]
    .createInstance(Ci.nsIDOMParser);

exports.emptyDocument = function () {
    return parser.parseFromString('<!doctype html><html></html>', 'text/html');
};

exports.rejectedScriptsDocument = function () {

    var htmlWithRejectedScripts = "<!doctype html>" +
        "<html>" +
        "<head>" +
        "<title>Fake Page</title>" +
        "<script>var i = 0;</script>" +
        "<script>var xhr = new XMLHttpRequest();</script>" +
        "</head>" +
        "<body>" +
        "\n" +
        "<h1></h1>" +
        "<p></p>" +
        "</body>" +
        "</html>";
    return parser.parseFromString(htmlWithRejectedScripts, "text/html");
};

exports.acceptedScriptsDocument = function () {

    var htmlWithAcceptedScripts = "<!doctype html>" +
        "<html>" +
        "<head>" +
        "<title>Fake Page</title>" +
        "<script>var i = 0;" +
        "var length = document.length;</script>" +
        "<script>for (; i < length; i++) {" +
        "console.log(i);" +
        "} </script>" +
        "</head>" +
        "\n" +
        "<body>" +
        "<h1></h1>" +
        "<p></p>" +
        "</body>" +
        "</html>";

    return parser.parseFromString(htmlWithAcceptedScripts, "text/html");

};

exports.domWithOnAttrib = function () {

    var html = "<!doctype html>" +
        "<html>" +
        "<head>" +
        "<title>Fake Page</title>" +
        "</head>" +
        "\n" +
        "<body onLoad=\"blah();\">" +
        "<h1></h1>" +
        "<p></p>" +
        "</body>" +
        "</html>";

    return parser.parseFromString(html, "text/html");

};
