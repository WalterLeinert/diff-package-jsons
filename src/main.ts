#!/usr/bin/env node


// Nodejs imports
import 'reflect-metadata';

const packageJson = require('../package.json');

// -------------------------------------- logging --------------------------------------------
// tslint:disable-next-line:no-unused-variable
import { getLogger, levels, using, XLog } from '@fluxgate/platform';
// -------------------------------------- logging --------------------------------------------


import { FlattenJson, OptionParser, OptionType, Option, EnumHelper, BidirectionalMap, StringBuilder } from '@fluxgate/core';
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


enum DependencyType {
  Normal,
  Dev,
  Peer
}


/**
 * 2-tupel with dependency type and package file path.
 */
class DependencyInfo {

  constructor(private _dependencyType: DependencyType,
    private _packageFile: string) {
  }

  public get type(): DependencyType {
    return this._dependencyType;
  }

  public get packageFile(): string {
    return this._packageFile;
  }
}


/**
 * Models all versions of a certain package
 */
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
  public static readonly dependencyTypeMapper = EnumHelper.getBidirectionalMap(DependencyType);
  private static dependencyTypeMap = new BidirectionalMap<string, DependencyType>(
    [
      'dependencies',
      'devDependencies',
      'peerDependencies'
    ], [
      DependencyType.Normal,
      DependencyType.Dev,
      DependencyType.Peer
    ]);

  constructor(private filePaths: string[], private types: DependencyType[]) {
  }


  public run() {
    using(new XLog(Main.logger, levels.INFO, 'run'), (log) => {
      const dependencyMap: Map<string, DependencyEntry> = new Map<string, DependencyEntry>();

      const typeKeys = [];
      this.types.forEach(
        t => typeKeys.push(Main.dependencyTypeMap.map2To1(t as DependencyType))
      );

      const typeKeysString = new StringBuilder();
      let first = true;
      typeKeys.forEach(t => {
        if (!first) {
          typeKeysString.append(', ');
        }
        typeKeysString.append(t);

        first = false;
      });


      this.filePaths.forEach((filePath) => {
        const json = JsonReader.readJsonSync(filePath);
        log.info(`read json file from ${filePath}`);

        const flattener = new FlattenJson(json);
        flattener.flatten();

        const packges = flattener.result.keys.filter(
          k => this.isDependency(k, typeKeys)
        );


        packges.forEach(packge => {
          const parts = packge.split('.');
          const dependencyType = Main.dependencyTypeMap.map1To2(parts[0]);
          const packgeName = parts[1];

          const version = flattener.result.get(packge);
          let entry: DependencyEntry;

          if (!dependencyMap.has(packgeName)) {
            entry = new DependencyEntry();
            dependencyMap.set(packgeName, entry);
          } else {
            entry = dependencyMap.get(packgeName);
          }

          entry.addInfo(version, new DependencyInfo(dependencyType, filePath));
        });

      });


      console.log();
      console.log(`----------------------------------------------------------------------`);
      console.log(`package differences for ${typeKeysString}`);
      console.log(`----------------------------------------------------------------------`);
      console.log();

      let differencesFound = false;
      dependencyMap.forEach((v, k) => {
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


  private isDependency(key: string, depKeys: string[]): boolean {
    for (let i = 0; i < depKeys.length; i++) {
      if (key.startsWith(depKeys[i] + '.')) {
        return true;
      }
    }
    return false;
  }


  private dumpDifference(packge: string, entry: DependencyEntry) {
    console.log(`================ package ${packge}`);

    entry.getVersions().forEach(version => {
      console.log(`  version ${version}: `);

      const infos = entry.getInfos(version);

      infos.forEach(info => {
        let type = '';
        if (info.type !== DependencyType.Normal) {
          type = ` (${Main.dependencyTypeMapper.map2To1(info.type)})`;
        }

        console.log(`    ${info.packageFile}${type}: `);
      });
    });

    console.log();
  }
}

try {
  let main = new Main(opts._args, [DependencyType.Normal, DependencyType.Dev]);
  main.run();

  main = new Main(opts._args, [DependencyType.Peer]);
  main.run();
} catch (err) {
  logger.error(err);
}