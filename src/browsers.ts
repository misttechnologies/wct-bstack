/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 */
import * as wd from 'wd';
import * as promisify from 'promisify-node';

export function expand(
      browsers: (string | wd.Capabilities)[]): wd.Capabilities[] {
  return (browsers || []).map((browser) => {
    if (typeof browser === 'string') {
      return <wd.Capabilities>{"browserName": <wd.ValidBrowserNames>browser.toLowerCase()};
    }
    browser.browserName = <wd.ValidBrowserNames>browser.browserName.toLowerCase();
    return browser;
  });
}
