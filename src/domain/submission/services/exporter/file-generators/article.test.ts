import { mocked } from 'ts-jest/utils';
import Axios from 'axios';
import { generateArticle } from './article';
import submission from './article.test.data';
import EJPName from '../../../../ejp-name/services/models/ejp-name';

jest.mock('axios');

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
        const ejpNamesMock = {
            findByName: async (name: string): Promise<EJPName | null> => {
                if (name === 'J. Edward Reviewer') {
                    return new EJPName(1, 'J. Edward', 'Reviewer');
                }

                return null;
            },
            create: jest.fn(),
        };

        const output = await generateArticle(submission, ejpNamesMock, 'secret');

        expect(output).toMatchSnapshot();
    });

    it('throws expected message when people api call rejects', async () => {
        const mockedGet = mocked(Axios.get, true);
        mockedGet.mockImplementation(() => {
            return Promise.reject();
        });
        const ejpNamesMock = {
            findByName: async (name: string): Promise<EJPName | null> => {
                if (name === 'J. Edward Reviewer') {
                    return new EJPName(1, 'J. Edward', 'Reviewer');
                }

                return null;
            },
            create: jest.fn(),
        };

        await expect(generateArticle(submission, ejpNamesMock, 'secret')).rejects.toThrowError(
            'People API failed to return info for elifePersonId: 87f34696',
        );
    });
});
