/* A node script that runs tests in a headless browser. */

(function libreJSTest() {
  const webdriver = require('selenium-webdriver');
  const firefox = require('selenium-webdriver/firefox');
  new webdriver.Builder().forBrowser('firefox')
    .setFirefoxOptions(new firefox.Options()
		       // Uncomment this line to test using icecat
//		       .setBinary("/usr/bin/icecat")
		       .headless()).build()
    .then(driver =>
      driver.installAddon("./librejs.xpi", /*isTemporary=*/true)
	.then(driver.get("about:debugging#/runtime/this-firefox"))
	.then(_ => driver.findElements(webdriver.By.css('.fieldpair dd')))
	.then(es => es[2].getText())
	.then(uuid =>
	  driver.get('moz-extension://'
		     + uuid + '/test/SpecRunner.html'
		     + (process.argv[2] ? '?seed=' + process.argv[2] : '') ))
	.then(_ => driver.wait(_ =>
 	  driver.findElement(webdriver.By.css('.jasmine-alert'))
	    .then(e => e.getText()), 10000))
	.then(_ => driver.findElement(webdriver.By.css('.jasmine-alert')))
	.then(e => e.getText())
	.then(console.log)
	.then(_ => driver.quit()));
})();
