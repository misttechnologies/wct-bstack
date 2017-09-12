/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 */
import * as browsers from './browsers';
import * as wd from 'wd';
import * as wct from 'wct';
import * as promisify from 'promisify-node';

interface PluginOptions {
  browsers: string[];
  username: string;
  accessKey: string;
}

/** WCT plugin that enables support for local browsers via Selenium. */
const plugin: wct.PluginInterface = (
      wct: wct.Context, pluginOptions: PluginOptions): void => {

  // The capabilities objects for browsers to run. We don't know the port until
  // `prepare`, so we've gotta hang onto them.
  let eachCapabilities: wct.BrowserDef[] = [];

  // Convert any local browser names into Webdriver capabilities objects.
  //
  // Note that we run this hook late to allow other plugins to append their
  // browsers. We don't want the default behavior (run all local browsers) to
  // kick in if someone has specified browsers via another plugin.
  const onConfigure = async () => {
    let names = browsers.normalize(pluginOptions.browsers);
    if (names.length > 0) {
      // We support comma separated browser identifiers for convenience.
      names = names.join(',').split(',');
    }

    const activeBrowsers = wct.options.activeBrowsers;
    if (activeBrowsers.length === 0 && names.length === 0) {
      names = ['all'];
    }
    // No local browsers for you :(
    if (names.length === 0) {
      return;
    }

    // Note that we **do not** append the browsers to `activeBrowsers`
    // until we've got a port chosen for the Selenium server.
    const expanded = await browsers.expand(names);

    wct.emit(
        'log:debug',
        'Expanded local browsers:', names, 'into capabilities:', expanded);
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
    updatePort(eachCapabilities);
  };
  wct.hook('prepare', function(done: (err?: any) => void) {
    onPrepare().then(() => done(), (err) => done(err));
  });

  // NOTE(rictic): I can't actually find the code that emits this event...
  //     There doesn't seem to be an obvious source in either wct or this
  //     plugin.
  wct.on('browser-start', (
        def: wct.BrowserDef, data: {url: string}, stats: wct.Stats,
        browser: any /* TODO(rictic): what is browser here? */) => {
    if (!browser) return;
    browser.maximize(function(err: any) {
      if (err) {
        wct.emit('log:error', def.browserName + ' failed to maximize');
      } else {
        wct.emit('log:debug', def.browserName + ' maximized');
      }
    });
  });
};

// Utility

function updatePort(capabilities: wct.BrowserDef[]) {
  capabilities.forEach(function(capabilities) {
    capabilities.url = {
      hostname: 'hub-cloud.browserstack.com/wd/hub',
      port:     80,
    };
  });
}

module.exports = plugin;
