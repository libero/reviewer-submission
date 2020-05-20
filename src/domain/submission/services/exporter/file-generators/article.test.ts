import { mocked } from 'ts-jest/utils';
import Axios from 'axios';
import * as crypto from 'crypto';
import { replace, includes } from 'lodash';
import ArticleGenerator from './article';
import submission from './article.test.data';

jest.mock('axios');

const md5 = (s: string): string =>
    crypto
        .createHash('md5')
        .update(s)
        .digest('hex');

const obfuscate = (s: string, re: RegExp): string => {
    let m;
    const matches = [];
    do {
        m = re.exec(s);
        if (m) {
            matches.push({ str: m[1], index: m.index });
        }
    } while (m);

    let newStr = s;

    matches.forEach(item => {
        // make sure this is idempotent
        if (includes(item.str, '.') && includes(item.str, '@')) {
            newStr = replace(newStr, item.str, md5(item.str));
        }
    });
    return newStr;
};

const obfuscateEmail = (s: string): string => {
    const re = new RegExp('<email>([^<>]+)</email>', 'g');
    return obfuscate(s, re);
};

const editorsData: { [key: string]: {} } = {
    '1e9e661f': {
        name: {
            surname: 'Zoghbi',
            givenNames: 'Huda',
        },
        emailAddresses: [{ value: '8ac3df4aa667c9217fe4d8bedfc06482', access: 'restricted' }],
        affiliations: [
            {
                name: ['Texas Children\u0027s Hospital'],
            },
        ],
    },
    '3edb2ed8': {
        name: {
            surname: 'Li',
            givenNames: 'Wenhui',
        },
        emailAddresses: [{ value: '5ddd85b12237e714f490a9c6cf585566', access: 'restricted' }],
        affiliations: [
            {
                name: ['National Institute of Biological Sciences'],
            },
        ],
    },
    '232d9893': {
        name: {
            surname: 'Struhl',
            givenNames: 'Kevin',
            preferred: 'Kevin Struhl',
            index: 'Struhl, Kevin',
        },
        emailAddresses: [{ value: '4f5cd09b1742dad17ffe48d0c33def8f', access: 'restricted' }],
        affiliations: [{ name: ['Harvard Medical School'] }],
    },
    '87f34696': {
        name: { surname: 'Yu', givenNames: 'Hao', preferred: 'Hao Yu', index: 'Yu, Hao' },
        emailAddresses: [{ value: 'd3fa5c7081fecbc7cfc02be293834b86', access: 'restricted' }],
        affiliations: [{ name: ['National University of Singapore \u0026 Temasek Life Sciences Laboratory'] }],
    },
    fd8295ba: {
        name: { surname: 'Zhang', givenNames: 'Hong', preferred: 'Hong Zhang', index: 'Zhang, Hong' },
        emailAddresses: [{ value: 'e69bf9f08f18063b3098e1cd63c26a23', access: 'restricted' }],
        affiliations: [
            {
                name: ['Institute of Biophysics Chinese Academy of Sciences'],
                address: { formatted: ['China'], components: { country: 'China' } },
            },
        ],
    },
    '6fabd619': {
        name: { surname: 'Zilberman', givenNames: 'Daniel', preferred: 'Daniel Zilberman', index: 'Zilberman, Daniel' },
        emailAddresses: [{ value: '08c6488ad00599649606fbb926a63f12', access: 'restricted' }],
        affiliations: [
            {
                name: ['John Innes Centre'],
                address: { formatted: ['United Kingdom'], components: { country: 'United Kingdom' } },
            },
        ],
    },
};

describe('ArticleGenerator', () => {
    it('generates correct xml', async () => {
        const mockedGet = mocked(Axios.get, true);
        mockedGet.mockImplementation(query => {
            const id = query.split('/').pop();
            return Promise.resolve({
                data: id ? editorsData[id] : {},
            });
        });

        const articleGenerator = new ArticleGenerator(submission);
        const output = await articleGenerator.execute();

        expect(obfuscateEmail(output)).toMatchSnapshot();
    });
});
