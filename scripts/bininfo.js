/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 * This code may only be used under the BSD style license found at https://github.com/misttechnologies/wct-bstack/blob/master/LICENSE
 * The complete set of contributors may be found at https://github.com/misttechnologies/wct-bstack/graphs/contributors
 */

const os      = require('os');
const refs = require('./../browserstacklocal-binaries.json');

function binInfo() {
  const platform = os.platform();
  let target = null;
  switch (os.platform()) {
    case 'darwin':
      target = refs['darwin'];
      break;
    case 'linux':
      if (os.arch().endsWith('64')) {
        target = refs['linux-64'];
      } else {
        target = refs['linux-32'];
      }
      break;
    case 'win32':
      target = refs['win32'];
      break;
  }
  if (target === null) {
    throw new Error('No matching BrowserStackLocal binary for your arch was found');
    process.exit(-1);
  }
  return target;
}

module.exports = binInfo;
