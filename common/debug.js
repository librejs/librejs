/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
* *
* Copyright (C) 2017, 2018 Nathan Nichols
* Copyright (C) 2018 Ruben Rodriguez <ruben@gnu.org>
* Copyright (C) 2022 Yuchen Pei <id@ypei.org>
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

const makeDebugLogger = (origin, enabled, time) => {
  return (a, b) => {
    if (enabled) {
      console.log('[' + origin + '] Time spent so far: ' + (Date.now() - time) / 1000 + ' seconds');
      if (b === undefined) {
        console.log(a);
      } else {
        console.log(a, b);
      }
    }
  }
}

module.exports = { makeDebugLogger };
