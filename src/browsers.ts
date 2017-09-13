/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 */
import * as wd from 'wd';
import * as promisify from 'promisify-node';

export function normalize(
      browsers: (string | {browserName: string})[]): string[] {
  return (browsers || []).map(function(browser) {
    if (typeof browser === 'string') {
      return browser;
    }
    return browser.browserName;
  });
}

/**
 * Expands an array of browser identifiers for locally installed browsers into
 * their webdriver capabilities objects.
 *
 * If `names` is empty, or contains `all`, all installed browsers will be used.
 */
export async function expand(names: string[]): Promise<wd.Capabilities[]> {
  const map: { [browserName: string]: wd.Capabilities; } = {};
  for (let browser of supported()) {
    map[browser.browserName] = browser;
  }
  if (names.indexOf('all') !== -1 || names.indexOf('default') !== -1) {
    names = Object.keys(map);
  }

  const unsupported = difference(names, Object.keys(map));
  if (unsupported.length > 0) {
    throw new Error(
        `The following browsers are unsupported: ${unsupported.join(', ')}. ` +
        `(All supported browsers: ${Object.keys(map).join(', ')})`
    );
  }

  return names.map(function(n) { return map[n]; });
}

/**
 * Exported and declared as `let` variables for testabilty in wct.
 *
 * @return A list of local browser names that are supported by
 *     the current environment.
 */
export let supported = function supported(): wd.Capabilities[] {
  return require('./../default-bstack-browsers.json');
};

/** Filter out all elements from toRemove from source. */
function difference<T>(source: T[], toRemove: T[]): T[] {
  return source.filter((value) => toRemove.indexOf(value) < 0);
}
