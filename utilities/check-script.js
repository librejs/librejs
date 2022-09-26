/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
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

/**
 * A node script that checks the supplied javascript for licenses and
 * triviality.  Does not work with web labels.
 *
 * Usage: node ./check-script.js <path/to/jsfile>
 *
 * Example:
 * echo '1+1;' > /tmp/trivial.js
 * node ./check-script.js /tmp/trivial.js
 * should output:
 * [ true, '1+1;\n', '\nScript appears to be trivial.' ]
 */

const { checkScriptSource } = require('../common/checks.js');
const { readFile } = require('fs');
readFile(process.argv[2], (err, data) => {
  if (err) throw err;
  console.log(checkScriptSource(data.toString(), process.argv[2]));
});
