"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 */
const browsers = require("./browsers");
const request = require("request");
const uuid = require("uuid");
/** WCT plugin that enables support for local browsers via Selenium. */
const plugin = (wct, pluginOptions) => {
    // The capabilities objects for browsers to run. We don't know the port until
    // `prepare`, so we've gotta hang onto them.
    let eachCapabilities = [];
    // Convert any local browser names into Webdriver capabilities objects.
    //
    // Note that we run this hook late to allow other plugins to append their
    // browsers. We don't want the default behavior (run all local browsers) to
    // kick in if someone has specified browsers via another plugin.
    const onConfigure = () => __awaiter(this, void 0, void 0, function* () {
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
        const expanded = yield browsers.expand(names);
        wct.emit('log:debug', 'Expanded browsers:', names, 'into capabilities:', expanded);
        eachCapabilities = expanded;
        // We are careful to append these to the configuration object, even though
        // we don't know the selenium port yet. This allows WCT to give a useful
        // error if no browsers were configured.
        activeBrowsers.push.apply(activeBrowsers, expanded);
    });
    wct.hookLate('configure', function (done) {
        onConfigure().then(() => done(), (err) => done(err));
    });
    const onPrepare = () => __awaiter(this, void 0, void 0, function* () {
        if (!eachCapabilities.length) {
            return;
        }
        updatePort(eachCapabilities, pluginOptions);
    });
    wct.hook('prepare', function (done) {
        onPrepare().then(() => done(), (err) => done(err));
    });
    // NOTE(rictic): I can't actually find the code that emits this event...
    //     There doesn't seem to be an obvious source in either wct or this
    //     plugin.
    wct.on('browser-start', (def, data, stats, browser /* TODO(rictic): what is browser here? */) => {
        if (!browser)
            return;
        browser.maximize(function (err) {
            if (err) {
                wct.emit('log:error', def.browserName + ' failed to maximize');
            }
            else {
                wct.emit('log:debug', def.browserName + ' maximized');
            }
        });
    });
    const updateStatus = (def, error, stats, sessionId, browser /* TODO(rictic): what is browser here? */) => {
        if (!browser || eachCapabilities.length == 0 || !sessionId)
            return;
        var payload = {
            status: (stats.status === 'complete' && stats.failing === 0) ? "passed" : "failed",
            reason: error
        };
        wct.emit('log:debug', 'Updating browserstack job', sessionId, payload);
        // Send the pass/fail info to sauce-labs if we are testing remotely.
        var username = wct.options.plugins["bstack"].username;
        var accessKey = wct.options.plugins["bstack"].accessKey;
        request.put({
            url: 'https://username:accessKey@www.browserstack.com/automate/sessions/' + encodeURIComponent(sessionId) + '.json',
            json: true,
            body: payload,
        });
    };
    wct.on('browser-end', updateStatus);
    wct.on('browser-fail', updateStatus);
};
// Utility
function updatePort(capabilities, options) {
    let id = 1;
    capabilities.forEach(function (capabilities) {
        capabilities.id = id++;
        capabilities.sessionId = uuid.v4();
        capabilities['browserstack.local'] = true;
        capabilities.url = {
            hostname: 'hub-cloud.browserstack.com/wd/hub',
            port: 80,
            username: (process.env.BROWSER_STACK_USERNAME || options.username),
            accesskey: (process.env.BROWSER_STACK_ACCESS_KEY || options.accessKey)
        };
    });
}
module.exports = plugin;
