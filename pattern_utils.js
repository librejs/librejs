/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
 * Copyright (C) 2014, 2015 Nik Nyby
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

exports.patternUtils = {
  /**
   * removeNonalpha
   *
   * Remove all nonalphanumeric values, except for
   * < and >, since they are what we use for tokens.
   *
   */
  removeNonalpha: function(str) {
    return str.replace(/[^a-z0-9<>@]+/gi, '');
  },

  removeWhitespace: function(str) {
    return str.replace(/\/\//gmi, '').replace(/\*/gmi, '').replace(/\s+/gmi, '');
  },

  replaceTokens: function(str) {
    return str.replace(/<.*?>/gi, '.*?');
  },

  removeJsComments: function(str) {
    const ml_comments = /\/\*.*?(\*\/)/g;
    const il_comments = /\/\/.*/gm;
    return str.replace(ml_comments, '').replace(il_comments, '');
  }
};
