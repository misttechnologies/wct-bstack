/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 * This code may only be used under the BSD style license found at https://github.com/misttechnologies/wct-bstack/blob/master/LICENSE
 * The complete set of contributors may be found at https://github.com/misttechnologies/wct-bstack/graphs/contributors
 */
import * as local       from './local';
import * as browsers    from './browsers';
import * as _           from 'lodash';
import * as wct         from 'wct';
import * as promisify   from 'promisify-node';
import * as request     from 'request';
import * as uuid        from 'uuid';

interface PluginOptions {
  browsers:         any[];
  username?:        string;
  accessKey?:       string;
  defaults?:        any; // default capabilities
  capabilities?:    any;
}

/** WCT plugin that enables support for local browsers via Selenium. */
const plugin: wct.PluginInterface = (
      wct: wct.Context, pluginOptions: PluginOptions): void => {
  normalizeOptions(pluginOptions);

  // The capabilities objects for browsers to run. We don't know the port until
  // `prepare`, so we've gotta hang onto them.
  let eachCapabilities: wct.BrowserDef[] = [];

  // Convert any local browser names into Webdriver capabilities objects.
  //
  // Note that we run this hook late to allow other plugins to append their
  // browsers. We don't want the default behavior (run all local browsers) to
  // kick in if someone has specified browsers via another plugin.
  const onConfigure = async () => {
    const activeBrowsers = wct.options.activeBrowsers;
    if (activeBrowsers.length === 0 && pluginOptions.browsers.length === 0) {
      pluginOptions.browsers = require('./../default-bstack-browsers.json');
    }

    // No browsers for you :(
    if (pluginOptions.browsers.length === 0) {
      return;
    }

    // Note that we **do not** append the browsers to `activeBrowsers`
    // until we've got a port chosen for the Selenium server.
    const expanded = await browsers.expand(pluginOptions.browsers);
    wct.emit(
        'log:debug',
        'Expanded browsers:', pluginOptions.browsers, 'into capabilities:', expanded);

    eachCapabilities = <wct.BrowserDef[]>expanded;
    // We are careful to append these to the configuration object, even though
    // we don't know the selenium port yet. This allows WCT to give a useful
    // error if no browsers were configured.
    activeBrowsers.push.apply(activeBrowsers, expanded);
  };
  wct.hookLate('configure', function(done: (err?: any) => void) {
    onConfigure().then(() => done(), (err) => done(err));
  });

  const onPrepare = async () => {
    if (!eachCapabilities.length) {
      return;
    }
    // Let anyone know, and give them a chance to modify the options prior to
    // booting up the BrowserStackLocal tunnel.
    await new Promise((resolve, reject) => {
      wct.emitHook('prepare:browserstack-local-tunnel', (e) => e ? reject(e) : resolve());
    });

    const id = pluginOptions.capabilities['browserstack.localIdentifier'];
    wct.emit('local:debug',
      `starting BrowserStackLocal tunnel with identifier = ${id}...`);
    await local.startTunnel(wct, id, pluginOptions.accessKey);
    updateCapabilities(eachCapabilities, pluginOptions);
  };
  wct.hook('prepare', function(done: (err?: any) => void) {
    onPrepare().then(() => done(), (err) => done(err));
  });

  wct.on('browser-start', (
        def: wct.BrowserDef, data: {url: string}, stats: wct.Stats,
        browser: any /* TODO(rictic): what is browser here? */) => {
    if (!browser) return;

    // NOTE keepalive hack that prevents browserstack session from going timeout
    browser._keepalive = setInterval(() => {
      browser.title((err: any, title: string) => {
        if (err) {
          wct.emit('log:error', `${def.browserName} failed to get title; the browser may have crashed`);
          //browser.quit(`${def.browserName} may have crashed`);
        } else {
          wct.emit('log:debug', `${def.browserName} is running and has ${title}`);
        }
      });
    }, (def['testTimeout'] / 2) || 45 * 1000);
    // do not let the keepalive hang node
    browser._keepalive.unref();
  });

  const updateStatus = (
        def: wct.BrowserDef, error: any, stats: wct.Stats, sessionId: string,
        browser: any /* TODO(rictic): what is browser here? */): void => {
    if (!browser || eachCapabilities.length == 0 || !sessionId) return;

    if (browser._keepalive) {
      clearInterval(browser._keepalive);
    }

    var payload = {
      status: (stats.status === 'complete' && stats.failing === 0 && !error) ? "passed" : "failed",
      reason: error
    };
    wct.emit('log:debug', 'Updating browserstack job', sessionId, payload);

    // Send the pass/fail info to sauce-labs if we are testing remotely.
    request.put({
      url:  'https://' + pluginOptions.username + ':' + pluginOptions.accessKey +
      '@www.browserstack.com/automate/sessions/' + encodeURIComponent(sessionId) + '.json',
      json: true,
      body: payload,
    });
  };
  wct.on('browser-end',  updateStatus);
  wct.on('browser-fail', updateStatus);
};

// Utility

function normalizeOptions(pluginOptions: PluginOptions) {
  if (process.env.BROWSER_STACK_USERNAME)
    pluginOptions.username = process.env.BROWSER_STACK_USERNAME;
  if (process.env.BROWSER_STACK_ACCESS_KEY)
    pluginOptions.accessKey = process.env.BROWSER_STACK_ACCESS_KEY;

  // required dicts / keys
  if (!("defaults" in pluginOptions)) {
    pluginOptions["defaults"] = {
      "browserstack.local": true
    };
  }
  if (!("browserstack.local" in pluginOptions.defaults)) {
    pluginOptions.defaults["browserstack.local"] = true;
  }

  // make if absent
  if (!("capabilities" in pluginOptions)) {
    pluginOptions["capabilities"] = {};
  }

  if ("capabilities" in pluginOptions && "browserstack" in pluginOptions.capabilities) {
    // flatten hierarchical keys for browserstack spec
    for (let key in pluginOptions.capabilities.browserstack) {
      pluginOptions.capabilities[`browserstack.${key}`] = pluginOptions.capabilities.browserstack[key];
      delete pluginOptions.capabilities.browserstack[key];
    }
    delete pluginOptions.capabilities['browserstack'];
  }

  // merge, with respects for given concrete values
  _.defaults(pluginOptions.capabilities, pluginOptions.defaults);

  // make identifier if absent
  if (!('browserstack.localIdentifier' in pluginOptions.capabilities)) {
    pluginOptions.capabilities['browserstack.localIdentifier'] = uuid.v4();
  }
}

function updateCapabilities(capabilities: wct.BrowserDef[], options: PluginOptions) {
  let id: number = 1;
  capabilities.forEach(function(capabilities) {
    capabilities.id = id++;
    capabilities.url = {
      hostname: 'hub-cloud.browserstack.com',
      port: 80,
      user: options.username,
      pwd:  options.accessKey
    };
    for (let key in options.capabilities) {
      if (!(key in capabilities)) capabilities[key] = options.capabilities[key];
    }
  });
}

module.exports = plugin;
