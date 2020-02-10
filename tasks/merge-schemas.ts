import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { importSchema } from 'graphql-import';

util.promisify(fs.mkdir)('lint-schemas', { recursive: true })
    .then(_ =>
        importSchema(path.join(__dirname, '..', 'src', './schemas/**/*.graphql'), {
            forceGraphQLImport: false,
            skipGraphQLImport: true,
        }),
    )
    .then(merged => util.promisify(fs.writeFile)('lint-schemas/all.graphql', merged, { encoding: 'utf8' }))
    .then(_ => console.log('done'))
    .catch((e: Error) => console.log('Error', e));
