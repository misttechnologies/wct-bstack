var webdriver = require('selenium-webdriver');

// Input capabilities
var capabilities = {
  'browserName' : 'chrome',
  'browserstack.user' : process.env.BROWSER_STACK_USERNAME,
  'browserstack.key' : process.env.BROWSER_STACK_ACCESS_KEY,
  'browserstack.debug' : 'true',
  'build' : 'First build',
  'browserstacl.local': true
}

var driver = new webdriver.Builder().
  usingServer('http://hub-cloud.browserstack.com/wd/hub').
  withCapabilities(capabilities).
  build();

driver.get('http://localhost');
//driver.findElement(webdriver.By.name('q')).sendKeys('BrowserStack');
//driver.findElement(webdriver.By.name('btnG')).click();

driver.getTitle().then(function(title) {
  console.log(title);
});

driver.quit();
