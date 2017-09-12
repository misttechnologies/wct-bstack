/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 */
var _ = require('lodash');

var DEFAULT_BROWSERS = require('../default-sauce-browsers.json');

// "<PLATFORM>/<BROWSER>[@<VERSION>]"
var BROWSER_SPEC = /^([^\/@]+)\/([^\/@]+)(?:@(.*))?$/;

var PROPERTY_BLACKLIST = ['accessKey', 'browsers', 'disabled', 'username'];

/**
 * Expands an array of browser identifiers for sauce browsers into their
 * webdriver capabilities objects.
 *
 * @param {!Object} pluginOptions
 * @param {function(*, Array<!Object>)} done
 */
function expand(pluginOptions, done) {
  var browsers = pluginOptions.browsers;
  // 'all' is really 'default', just to be consistent with wct-local.
  if (browsers.indexOf('default') !== -1 || browsers.indexOf('all') !== -1) {
    // TODO(nevir): Figure out the latest version of each browser and pick
    // appropriate spreads of versions & OSes.
    browsers = browsers.concat(_.cloneDeep(DEFAULT_BROWSERS));
    browsers = _.difference(browsers, ['default', 'all']);
  }

  done(null, _.compact(browsers.map(_expandBrowser.bind(
    null,
    pluginOptions,
    _.omit(pluginOptions, PROPERTY_BLACKLIST)
  ))));
}

/**
 * @param {string} username
 * @param {string} accessKey
 * @param {!Object} options
 * @param {string|!Object} browser
 * @return {Object}
 */
function _expandBrowser(options, extend, browser) {
  if (!_.isObject(browser)) {
    var match = _.isString(browser) && browser.match(BROWSER_SPEC);

    if (!match) {
      console.log('Invalid sauce browser spec:', browser);
      return null;
    }
    else {
      browser = {
        browserName: match[2],
        platform:    match[1],
        version:     match[3] || '',
      };
    }
  }

  return _.extend(browser, {
    url: {
      'hostname':           'http://hub-cloud.browserstack.com/wd/hub',
      'browserstack.user':  options.username,
      'browserstack.key':   options.accessKey,
      'browserstack.debug': 'true'
    },
  }, extend);
}

module.exports = {
  expand: expand,
};