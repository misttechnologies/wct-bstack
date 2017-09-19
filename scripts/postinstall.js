/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 * This code may only be used under the BSD style license found at https://github.com/misttechnologies/wct-bstack/blob/master/LICENSE
 * The complete set of contributors may be found at https://github.com/misttechnologies/wct-bstack/graphs/contributors
 */

const path    = require('path');
const fs      = require('fs');
const request = require('request');
const unzip   = require('unzip');
const binInfo = require('./bininfo');

const target = binInfo();
var dest = path.resolve(__dirname, './../bin');
console.log(`Downloading BrowserStackLocal binary from ${target['url']} to ${dest}/${target['filename']} ...`);
var extractor = request(target['url']).pipe(unzip.Extract({path: dest}));
extractor.on('close', () => {
  fs.chmodSync(`${dest}/${target['filename']}`, 0755);
  console.log("Success.");
});
