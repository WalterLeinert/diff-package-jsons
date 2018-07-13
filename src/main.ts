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


import { FlattenJson, OptionParser, OptionType, Option, Types, Utility, StringUtil } from '@fluxgate/core';
import { JsonReader } from '@fluxgate/platform';


let logger = getLogger('main');
// -------------------------- logging -------------------------------


//
// -------------------------- option parsing ------------------------
//
let parser = new OptionParser([
  new Option(['version'], OptionType.Bool, 'Show version.'),
  new Option(['verbose', 'v'], OptionType.Bool, 'More verbose output.'),
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

function usage(message?: string) {
  let help = parser.help(true);

  if (message) {
    console.log(message);
    console.log();
  }
  console.log('usage: diff-package-jsons [OPTIONS]\n'
    + 'options:\n'
    + help);

  console.log(`Version: ${packageJson.version}`);
  process.exit(0);
}
//
// -------------------------- option parsing ------------------------
//

class DependencyInfo {

  constructor(private _isDev: boolean,
    private _packageFile: string) {
  }

  public get isDev(): boolean {
    return this._isDev;
  }

  public get packageFile(): string {
    return this._packageFile;
  }
}


class DependencyEntry {
  private _versionInfos: Map<string, DependencyInfo[]>;

  constructor() {
    this._versionInfos = new Map<string, DependencyInfo[]>();
  }

  public hasInfo(version: string) {
    return this._versionInfos.has(version);
  }

  public addInfo(version: string, info: DependencyInfo) {
    if (this._versionInfos.has(version)) {
      this._versionInfos.get(version).push(info);
    } else {
      this._versionInfos.set(version, [info]);
    }
  }

  public getInfos(version: string): DependencyInfo[] {
    return this._versionInfos.get(version);
  }

  public getVersions(): string[] {
    return Array.from(this._versionInfos.keys());
  }
}


class Main {
  static logger = getLogger('Main');
  public static readonly LINE = '================================================================================';

  constructor(private filePaths: string[]) {
  }


  public run() {
    using(new XLog(Main.logger, levels.INFO, 'run'), (log) => {

      const dependencyMap: Map<string, DependencyEntry> = new Map<string, DependencyEntry>();

      this.filePaths.forEach((filePath) => {
        const json = JsonReader.readJsonSync(filePath);
        log.info(`read json file from ${filePath}`);

        const flattener = new FlattenJson(json);
        flattener.flatten();

        const packges = flattener.result.keys.filter(k => k.startsWith('dependencies.') || k.startsWith('devDependencies.'));


        packges.forEach(packge => {
          const parts = packge.split('.');
          const isDevDependencies = parts[0] === 'devDependencies';
          const packgeName = parts[1];

          const version = flattener.result.get(packge);
          let entry: DependencyEntry;

          if (!dependencyMap.has(packgeName)) {
            entry = new DependencyEntry();
            dependencyMap.set(packgeName, entry);
          } else {
            entry = dependencyMap.get(packgeName);
          }

          entry.addInfo(version, new DependencyInfo(isDevDependencies, filePath));
        });

      });

      let differencesFound = false;
      dependencyMap.forEach((v, k, map) => {
        const versions = v.getVersions();

        if (versions.length > 1) {
          differencesFound = true;
          this.dumpDifference(k, v);
        }
      })

      if (!differencesFound) {
        console.log('no version differences found');
      }
    });
  }

  private dumpDifference(packge: string, entry: DependencyEntry) {
    console.log();
    console.log(`================ package ${packge}`);

    entry.getVersions().forEach(version => {
      console.log(`  version ${version}: `);

      const infos = entry.getInfos(version);
      infos.forEach(info => {
        console.log(`    ${info.packageFile}${info.isDev ? ' (dev)' : ''}: `);
      });

    });
  }
}

try {
  let main = new Main(opts._args);
  main.run();
} catch (err) {
  logger.error(err);
}