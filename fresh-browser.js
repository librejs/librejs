/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2021 Yuchen Pei
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
 * A node script that starting a fresh browser loaded with the addon
 * for manual testing.
 * Usage:
 * node ./fresh-browser.js [url]
 */

(function freshBrowser() {
  const webdriver = require('selenium-webdriver');
  const firefox = require('selenium-webdriver/firefox');
  new webdriver.Builder().forBrowser('firefox')
    .setFirefoxOptions(new firefox.Options()
      // Uncomment this line to test using icecat
      //		       .setBinary("/usr/bin/icecat")
    ).build()
    .then(driver =>
      driver.installAddon("./librejs.xpi", /*isTemporary=*/true)
        .then(process.argv[2] ? driver.get(process.argv[2]) : {}));
})();
