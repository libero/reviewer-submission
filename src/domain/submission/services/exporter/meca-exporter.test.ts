import { MecaExporter } from './meca-exporter';
import { FileService } from '../../../file/services/file-service';
import File from '../../../file/services/models/file';
import submission from './file-generators/article.test.data';
import * as generators from './file-generators';
import { EJPNameRepository } from 'src/domain/ejp-name/repositories/types';

const mockFile = jest.fn();
const mockGenerateAsync = jest.fn();

jest.mock('jszip', () => {
    return jest.fn().mockImplementation(() => ({
        file: mockFile,
        generateAsync: mockGenerateAsync,
    }));
});

jest.spyOn(generators, 'generateArticle').mockImplementation(async () => 'article');
jest.spyOn(generators, 'generateCoverLetter').mockImplementation(async () => Buffer.from('coverLetter', 'utf8'));
jest.spyOn(generators, 'generateDisclosure').mockImplementation(async () => Buffer.from('disclosure', 'utf8'));
jest.spyOn(generators, 'generateManifest').mockImplementation(() => 'manifest');
jest.spyOn(generators, 'generateTransfer').mockImplementation(async () => 'transfer');

describe('MecaExporter', () => {
    const findManuscriptFile = jest.fn();
    const getSupportingFiles = jest.fn();
    const getFileContent = jest.fn();
    const fileService = ({
        findManuscriptFile,
        getSupportingFiles,
        getFileContent,
    } as unknown) as FileService;
    const ejpNames = ({
        create: jest.fn(),
        findByName: jest.fn(),
    } as unknown) as EJPNameRepository;

    it('exports correctly', async () => {
        const manuscriptFile = { filename: 'manuscript.pdf' } as File;
        const supportingFiles = [{ filename: 'supporting1.pdf' } as File, { filename: 'supporting2.pdf' } as File];

        findManuscriptFile.mockImplementation(() => Promise.resolve(manuscriptFile));
        getSupportingFiles.mockImplementation(() => Promise.resolve(supportingFiles));
        getFileContent
            .mockImplementationOnce(() => Promise.resolve('manuscript'))
            .mockImplementationOnce(() => Promise.resolve('supporting 1'))
            .mockImplementationOnce(() => Promise.resolve('supporting 2'));

        const mecaExporter = new MecaExporter(fileService, ejpNames, 'secret');
        await mecaExporter.export(submission, '1.2.3.4');

        expect(mockFile).toHaveBeenCalledTimes(8);
        expect(mockFile.mock.calls[0]).toEqual(['article.xml', 'article']);
        expect(mockFile.mock.calls[1]).toEqual(['cover_letter.pdf', Buffer.from('coverLetter', 'utf8')]);
        expect(mockFile.mock.calls[2]).toEqual(['disclosure.pdf', Buffer.from('disclosure', 'utf8')]);
        expect(mockFile.mock.calls[3]).toEqual(['manifest.xml', 'manifest']);
        expect(mockFile.mock.calls[4]).toEqual(['transfer.xml', 'transfer']);
        expect(mockFile.mock.calls[5]).toEqual(['manuscript.pdf', 'manuscript']);
        expect(mockFile.mock.calls[6]).toEqual(['supporting1.pdf', 'supporting 1']);
        expect(mockFile.mock.calls[7]).toEqual(['supporting2.pdf', 'supporting 2']);
        expect(mockGenerateAsync).toHaveBeenCalledTimes(1);
    });

    it('throws if no manuscript file set', async () => {
        findManuscriptFile.mockImplementation(() => Promise.resolve(null));

        const mecaExporter = new MecaExporter(fileService, ejpNames, 'secret');
        await expect(mecaExporter.export(submission, '1.2.3.4')).rejects.toThrowError('No manuscript file');
    });
});
