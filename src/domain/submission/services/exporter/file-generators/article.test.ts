import { mocked } from 'ts-jest/utils';
import ArticleGenerator from './article';
import submission from './article.test.data';
import Axios from 'axios';

jest.mock('axios');

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

        console.log(output);
        expect(output).toMatchSnapshot();
    });
});
