/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 * This code may only be used under the BSD style license found at https://github.com/misttechnologies/wct-bstack/blob/master/LICENSE
 * The complete set of contributors may be found at https://github.com/misttechnologies/wct-bstack/graphs/contributors
 */
import * as wd from 'wd';

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
