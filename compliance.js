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
 * A node script that opens the supplied url and outputs librejs
 * compliance.
 *
 * Usage: node ./compliance.js <url>
 *
 * It opens the url, saves a screenshot, and outputs text from the
 * LibreJS display panel about the webpage compliance.
 */

var fs = require('fs');

(function libreJSCompliance() {
  const webdriver = require('selenium-webdriver');
  const firefox = require('selenium-webdriver/firefox');
  new webdriver.Builder().forBrowser('firefox')
    .setFirefoxOptions(new firefox.Options()
		       // Uncomment this line to test using icecat
//		       .setBinary("/usr/bin/icecat")
		       .headless())
    .build()
    .then(driver =>
      driver.installAddon("./librejs.xpi", /*isTemporary=*/true)
	.then(driver.get("about:debugging#/runtime/this-firefox"))
	.then(_ => driver.findElements(webdriver.By.css('.fieldpair dd')))
	.then(es => es[2].getText())
	.then(uuid =>
	  driver.get(process.argv[2])
	  // Wait for the webpage to load
	    .then(_ => driver.sleep(5000))
	    .then(_ => driver.takeScreenshot())
	    .then(s => fs.writeFile(
	      "/tmp/screen.png", Buffer.from(s, 'base64'), "binary",
	      err => err ? console.log(err) : console.log("Screenshot saved to /tmp/screen.png")))
	    .then(_ => driver.executeScript("window.open('');"))
	    .then(_ => driver.getAllWindowHandles())
	    .then(handles => driver.switchTo().window(handles[1]))
	    .then(_ => driver.get('moz-extension://'
			     + uuid
			     + '/html/display_panel/content/display-panel.html#fromTab=1'))
	    .then(_ => driver.findElement(webdriver.By.css('div#info')))
	    .then(e => e.getText())
	    .then(console.log))
	.then(_ => driver.quit()));
})();
