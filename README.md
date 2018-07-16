# @tools/diff-package-jsons -- Tool zum Finden von unterschiedlichen Versionen bei den package.json Abhängigkeiten 

### Walter Leinert, Jul 2018

## Installation

```bash
npm install -g @tools/diff-package-jsons
```

## Features

Tool zum Finden von unterschiedlichen Versionen bei den package.json Abhängigkeiten 

```bash
usage: diff-package-jsons [OPTIONS] <package-json1> <package-json2> ... <package-jsonN>
options:
    -v, --verbose            More verbose output.
    -h, --help               Show help.
```

Beispiele:

```shell
$ diff-package-jsons <package-json1> <package-json2> ... <package-jsonN>
```


## Details

Verwendet die Klasse FlattenJson aus @fluxgate/core.