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

/**
 * parse.js
 *
 * A chrome worker that we keep working for the duration
 * of the session.
 *
 * It takes about 10-12M in memory when not actively running, and it
 * is much faster than reloading the Narcissus scripts for every
 * script.
 *
 */

importScripts('./jsdefs.js', './jslex.js', './jsparse.js');

self.onmessage = function(event) {
    if (event.data === 'stop') {
        // destroy chrome worker.
        self.close();
        return;
    }

    var obj = JSON.parse(event.data);
    var tree;

    try {
        tree = new Narcissus.parser.parse(obj.code);
        self.postMessage({'tree': tree, 'hash': obj.hash});
    } catch (x) {
        // error with parsing. Delete all.
        self.postMessage({'hash': obj.hash});
    }

    tree = null;
    obj = null;
};
