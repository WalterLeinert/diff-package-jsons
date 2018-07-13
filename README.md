# @tools/diff-package-jsons -- Tool zum Finden von unterschiedlichen Versionen bei den package.json Abhängigkeiten 

### Walter Leinert, Jul 2018

## Installation

```bash
npm install -g @tools/diff-package-jsons
```

## Features

Tool zum Finden von unterschiedlichen Versionen bei den package.json Abhängigkeiten 

```bash
usage: diff-package-jsons [OPTIONS]
options:
    -v, --verbose            More verbose output.
    -f ARG, --file=ARG       Json-Datei.
    -h, --help               Show help.
```

Beispiele:

```shell
$ diff-package-jsons <package-json1> <package-json2> ... <package-jsonN>
```


## Details

Verwendet die Klasse FlattenJson aus @fluxgate/core.