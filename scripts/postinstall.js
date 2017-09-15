const fs      = require('fs');
const os      = require('os');
const path    = require('path');
const request = require('request');
const unzip   = require('unzip');
const refs = require('./../browserstacklocal-binaries.json');

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

var dest = path.resolve(__dirname, './../bin/');
console.log(`Downloading BrowserStackLocal binary to ${dest}...`);
request(target['url']).pipe(unzip.Extract({path: dest}));
