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
 */

/*
 * Handle messages sent from add-on to the content script
 */
self.on('message', function (message) {
    var reason = message[0];

    if (reason == "INCOMINGPREFS") {
        // These are the prefs we need to set up the pref panel
        initPanel(message);
    }
});

function initPanel(prefObject) {
    for (var i in prefObject) {
        if (prefObject[i]) {
            if (prefObject[i].split(":")[1]) {
                try {
                    var item = this.document.getElementById(
                        "pref_" + prefObject[i].split(":")[0]);
                    item.checked = prefObject[i].split(":")[1] == "true";
                } catch(e) {
                    //"ERROR: " + //console.log(i);
                }
            }
        }
    }


    var inputs = this.document.getElementsByTagName("input");

    for (i in inputs) {
        input = inputs[i]; // correct version

        if (input) {
            if (input.nodeName == "INPUT") {
                input.onclick = function() {
                    self.postMessage(
                        "SETPREF:" +
                            this.id.split("pref_")[1] +
                            ":" + this.checked);
                };
            }
        }
    }

    prefObject = null;
}
