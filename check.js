var webdriver = require('selenium-webdriver');

// Input capabilities
var capabilities = {
  'browserName' : 'chrome',
  'browserstack.user' : process.env.BSTACK_USER,
  'browserstack.key' : process.env.BSTACK_KEY,
  'browserstack.debug' : 'true',
  'build' : 'First build'
}

var driver = new webdriver.Builder().
  usingServer('http://hub-cloud.browserstack.com/wd/hub').
  withCapabilities(capabilities).
  build();

driver.get('http://www.google.com');
driver.findElement(webdriver.By.name('q')).sendKeys('BrowserStack');
driver.findElement(webdriver.By.name('btnG')).click();

driver.getTitle().then(function(title) {
  console.log(title);
});

driver.quit();
