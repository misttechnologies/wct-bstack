/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 */
import * as path          from 'path';
import * as child_process from 'child_process';
import * as wct           from 'wct';
import * as chalk         from 'chalk';
import * as cleankill     from 'cleankill';

const binInfo = require('./../scripts/bininfo');

export async function startTunnel(wct: wct.Context, identifier: string, key: string) {
  return new Promise((resolve, reject) => {
    wct.emit(
      'log:info', 'Initializing BrowserStackLocal tunnel with localIdentifier:',
      chalk.magenta(identifier));

    var binPath = path.resolve(__dirname, `./../bin/${binInfo()['filename']}`);
    var proc = child_process.spawn(binPath, `--key ${key} --local-identifier ${identifier}`.split(' '));

    function isActive(logs: string) {
      // the binary must puts logs which contains "Ctrl-C" string when it got ready
      return (logs.indexOf("Ctrl-C") !== -1);
    }

    let log: string = "";
    function onOutput(data: any) {
      const message = data.toString();
      log += message;

      // scan the stored log to detect when it's ready
      if (isActive(log)) {
        wct.emit(
          'log:info', 'BrowserStackLocal tunnel is', chalk.green('ready'));
        resolve();
      } else {
        wct.emit('log:info', message);
      }
    }

    proc.stdout.on('data', onOutput);
    proc.stderr.on('data', onOutput);

    // Make sure that we interrupt the selenium server ASAP.
    cleankill.onInterrupt(function(done) {
      wct.emit(
        'log:info',
        chalk.yellow('BrowserStackLocal tunnel will be destroyed now'));
      proc.kill();
      done();
    });
  });
}
