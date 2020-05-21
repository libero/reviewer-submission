import { mocked } from 'ts-jest/utils';
import Axios from 'axios';
import ArticleGenerator from './article';
import submission from './article.test.data';

jest.mock('axios');

// const md5 = (s: string): string =>
//     crypto
//         .createHash('md5')
//         .update(s)
//         .digest('hex');

// const obfuscate = (s: string, re: RegExp): string => {
//     let m;
//     const matches = [];
//     do {
//         m = re.exec(s);
//         if (m) {
//             matches.push({ str: m[1], index: m.index });
//         }
//     } while (m);

//     let newStr = s;

//     matches.forEach(item => {
//         // make sure this is idempotent
//         if (includes(item.str, '.') && includes(item.str, '@')) {
//             newStr = replace(newStr, item.str, md5(item.str));
//         }
//     });
//     return newStr;
// };

// const obfuscateEmail = (s: string): string => {
//     const re = new RegExp('<email>([^<>]+)</email>', 'g');
//     return obfuscate(s, re);
// };

const generateEditor = (surname: string, givenNames: string, email: string, affiliation: string): object => ({
    name: {
        surname,
        givenNames,
    },
    emailAddresses: [{ value: email, access: 'restricted' }],
    affiliations: [
        {
            name: [affiliation],
        },
    ],
});

const editorsData: { [key: string]: {} } = {
    '1e9e661f': generateEditor('Bluth', 'Michael', 'm.bluth@example.com', 'Bluth research centre'),
    '3edb2ed8': generateEditor('Holt', 'Steve', 's.holt@example.com', 'High School'),
    '232d9893': generateEditor('Funke', 'Tobias', 't.funke@example.com', 'Blue man group'),
    '87f34696': generateEditor('Bluth', 'Gob', 'g.bluth@example.com', 'Magician circle'),
    fd8295ba: generateEditor('Bluth', 'Lucille', 'l.bluth@example.com', 'Balboa Towers'),
    '6fabd619': generateEditor('Funke', 'Lindsay', 'l.funke@example.com', 'Home'),
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

        expect(output).toMatchSnapshot();
    });
});
