import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { loadSchema } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { printSchema } from 'graphql';

// 1. ensure lint-schemas dir exists
// 2. import and merge schemas in the same way as the server
// 3. write the file to a location that is gitignored.
// 4. lint -> exit 1 for fail, 0 for pass.
util.promisify(fs.mkdir)('lint-schemas', { recursive: true })
    .then(_ =>
        loadSchema(path.join(__dirname, '..', 'src', './schemas/**/*.graphql'), {
            loaders: [new GraphQLFileLoader()],
        }),
    )
    .then(merged => util.promisify(fs.writeFile)('lint-schemas/all.graphql', printSchema(merged), { encoding: 'utf8' }))
    .then(_ => process.exit(0))
    .catch(_ => process.exit(1));