/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
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
 */

/**
 * This file works in conjunction with lib/html_script_finder/js_web_labels.js
 * to find mentions of external JavaScript files and their license information.
 * This allows the dom_handler to allow them by default.
 */

/**
 * @param {Array} licenses - An array of html nodes.
 *
 * @return {Array} - An array of simple license objects.
 */
function getLicensesArrayFromElements(licenses) {
    var a = [];
    // Convert the html node into a simpler object
    for (var i = 0; i < licenses.length; i++) {
        a.push({
            licenseName: licenses[i].textContent,
            licenseUrl: licenses[i].href
        });
    }
    return a;
}

/**
 * @param {Array} sources - An array of html nodes.
 *
 * @return {Array} - An array of simple source objects.
 */
function getSourcesArrayFromElements(sources) {
    var a = [];
    for (var i = 0; i < sources.length; i++) {
        a.push({
            sourceName: sources[i].textContent,
            sourceUrl: sources[i].href
        });
    }
    return a;
}

// find table.
exports.getLicenseList = function(document) {
    var tbl = document.getElementById('jslicense-labels1');
    var jsList = [];
    var i = 0;
    var le;
    var rows;
    var link;
    var fileCell;
    var licenseCell;
    var sourceCell;
    var row;

    if (tbl) {
        try {
            rows = tbl.getElementsByTagName('tr');
            le = rows.length;
            var mockElem = {textContent: 'Unknown', href: 'Unknown'};
            // loop through rows, and add each valid element to
            // the array.
            for (; i < le; i++) {
                row = rows[i].getElementsByTagName('td');

                // Find script url
                if (row[0] && row[0].getElementsByTagName('a')[0]) {
                    fileCell = row[0].getElementsByTagName('a')[0];
                } else {
                    fileCell = mockElem;
                }

                // 'licenses' and 'sources' will, for normal cases, just
                // contain one element. If the fileCell is pointing to a
                // combined JS file with multiple licenses, though, these
                // arrays will contain multiple elements.

                // Find license info
                var licenses = [mockElem];
                if (row[1] && row[1].getElementsByTagName('a').length > 0) {
                    licenses = getLicensesArrayFromElements(
                        row[1].getElementsByTagName('a'));
                }

                // Find original source info
                var sources = [mockElem];
                if (row[2] && row[2].getElementsByTagName('a').length > 0) {
                    sources = getSourcesArrayFromElements(
                        row[2].getElementsByTagName('a'));
                }

                if (fileCell.href !== 'Unknown') {
                    jsList.push({
                        'fileName': fileCell.textContent,
                        'fileUrl': fileCell.href,

                        // we'll fill this with value when needed to compare
                        // script.
                        'fileHash': null,

                        'licenses': licenses,
                        'sources': sources
                    });
                }
            }
        } catch (e) {
            console.debug(
                'Error fetching JS Web Label licenses',
                e, e.lineNumber, e.fileName, 'index is', i);
        }
    }

    return jsList;
};
