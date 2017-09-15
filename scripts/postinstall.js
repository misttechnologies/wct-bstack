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
