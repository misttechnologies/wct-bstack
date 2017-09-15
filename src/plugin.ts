/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 */
import * as browsers    from './browsers';
import * as wct         from 'wct';
import * as promisify   from 'promisify-node';
import * as request     from 'request';
import * as uuid        from 'uuid';

interface PluginOptions {
  defaults:         any;
  browsers:         string[];
  username?:        string;
  accessKey?:       string;
  debug?:           boolean;
  video?:           boolean;
  networkLogs?:     boolean;
  local?:           boolean;
  localIdentifier?: string;
  project?:         string;
  build?:           string;
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
    let names = browsers.normalize(pluginOptions.browsers);
    if (names.length > 0) {
      // We support comma separated browser identifiers for convenience.
      names = names.join(',').split(',');
    }

    const activeBrowsers = wct.options.activeBrowsers;
    if (activeBrowsers.length === 0 && names.length === 0) {
      names = ['all'];
    }
    // No browsers for you :(
    if (names.length === 0) {
      return;
    }

    // Note that we **do not** append the browsers to `activeBrowsers`
    // until we've got a port chosen for the Selenium server.
    const expanded = await browsers.expand(names);
    wct.emit(
        'log:debug',
        'Expanded browsers:', names, 'into capabilities:', expanded);

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
    wct.emit('log:debug', pluginOptions);
    updateCapabilities(eachCapabilities, pluginOptions);
  };
  wct.hook('prepare', function(done: (err?: any) => void) {
    onPrepare().then(() => done(), (err) => done(err));
  });

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

  const updateStatus = (
        def: wct.BrowserDef, error: any, stats: wct.Stats, sessionId: string,
        browser: any /* TODO(rictic): what is browser here? */): void => {
    if (!browser || eachCapabilities.length == 0 || !sessionId) return;

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
  if (!pluginOptions.local)
    pluginOptions.local = pluginOptions.defaults.local || true;
  if (!pluginOptions.localIdentifier)
    pluginOptions.localIdentifier = pluginOptions.defaults.localIdentifier || uuid.v4();
  if (!pluginOptions.video)
    pluginOptions.video = pluginOptions.defaults.video || false;
  if (!pluginOptions.debug)
    pluginOptions.debug = pluginOptions.defaults.debug || false;
  if (!pluginOptions.networkLogs)
    pluginOptions.networkLogs = pluginOptions.defaults.networkLogs || false;
  if (!pluginOptions.project)
    pluginOptions.project = pluginOptions.defaults.project || "";
  if (!pluginOptions.build)
    pluginOptions.build = pluginOptions.defaults.build || "untitled build";
}

function updateCapabilities(capabilities: wct.BrowserDef[], options: PluginOptions) {
  let id: number = 1;
  capabilities.forEach(function(capabilities) {
    capabilities.id = id++;
    capabilities['browserstack.local']            = options.local;
    capabilities['browserstack.localIdentifier']  = options.localIdentifier;
    capabilities['browserstack.video']            = options.video;
    capabilities['browserstack.debug']            = options.debug;
    capabilities['browserstack.networkLogs']      = options.networkLogs;
    capabilities['project']                       = options.project || "";
    capabilities['build']                         = options.defaults.build || "";
    capabilities.url = {
      hostname: 'hub-cloud.browserstack.com',
      port: 80,
      user: options.username,
      pwd:  options.accessKey
    };
  });
}

module.exports = plugin;
