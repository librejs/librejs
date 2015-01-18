/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
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

exports.scriptTypes = {
    INLINE: 0,
    EXTERNAL: 1,
    ATTRIBUTE: 2,
    SINGLETON: 3
};

exports.statusTypes = {
    UNCHECKED: 0,
    CHECKED: 1,
    ACCEPTED: 2,
    REJECTED: 3,
    JSWEBLABEL: 4
};

exports.reasons = {
    'FUNCTIONS_INLINE': 'This script is detected as inline, nonfree, defining functions or methods, and the rest of the page as loading external scripts',
    'FUNCTIONS_EXTERNAL': 'This script is detected as nonfree, external, and as defining functions or methods',
    'CONSTRUCT': 'This script is detected as nonfree and as defining nontrivial constructs',
    'FREE': 'This script is detected as free',
    'TRIVIAL': 'This script is detected as trivial',
    'TRIVIAL_NOT_ALLOWED': 'This script is detected as trivial, but trivial is not allowed here because of other scripts'
};
