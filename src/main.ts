#!/usr/bin/env node


// Nodejs imports
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as util from 'util';

const packageJson = require('../package.json');

// -------------------------------------- logging --------------------------------------------
// tslint:disable-next-line:no-unused-variable
import { getLogger, ILogger, levels, using, XLog } from '@fluxgate/platform';
// -------------------------------------- logging --------------------------------------------


import { FlattenJson, OptionParser, OptionType, Option, Types } from '@fluxgate/core';
import { JsonReader } from '@fluxgate/platform';


let logger = getLogger('main');
// -------------------------- logging -------------------------------


//
// -------------------------- option parsing ------------------------
//
let parser = new OptionParser([
  new Option(['version'], OptionType.Bool, 'Show version.'),
  new Option(['verbose', 'v'], OptionType.Bool, 'More verbose output.'),
  new Option(['file', 'f'], OptionType.String, 'Filename of json file.', null),
  new Option(['help', 'h'], OptionType.Bool, 'Show help.')
]);

let opts = parser.parse(process.argv);

if (opts.verbose) {
  console.log('# opts:', opts);
  console.log('# args:', opts._args);
}

if (opts.version) {
  console.log(packageJson.version);
  process.exit(0);
}


if (opts.help) {
  usage();
}

if (!opts.file) {
  usage('Option "--file <jsonFile>" fehlt.');
}

function usage(message?: string) {
  let help = parser.help(true);

  if (message) {
    console.log(message);
    console.log();
  }
  console.log('usage: flatten-jason [OPTIONS]\n'
    + 'options:\n'
    + help);

  console.log(`Version: ${packageJson.version}`);
  process.exit(0);
}
//
// -------------------------- option parsing ------------------------
//


class Main {
  static logger = getLogger('Main');

  constructor(private filePath: string) {

  }


  public run() {
    using(new XLog(Main.logger, levels.INFO, 'run'), (log) => {
      const json = JsonReader.readJsonSync(this.filePath);
      log.info(`read json file from ${this.filePath}`);

      const flattener = new FlattenJson(json);
      flattener.flatten();

      console.log(flattener.toString());
    });
  }
}

try {
  let main = new Main(opts.file);
  main.run();
} catch (err) {
  logger.error(err);
}