import { MailService } from './mail-service';
import SES from 'aws-sdk/clients/ses';
jest.mock('aws-sdk/clients/ses');

describe('mailService', () => {
    let mockSES: SES;

    beforeEach(() => {
        jest.resetAllMocks();
        mockSES = ({
            sendEmail: jest.fn(() => ({
                promise: jest.fn(),
            })),
        } as unknown) as SES;
    });

    const toAddress = 'hi@elifesciences.org';
    const sender = 'noreply@elifesciences.org';
    const htmlMessage = `<p>html</p>`;
    const textMessage = 'text';
    const subject = 'subject';

    it('should return false is email is disabled', async () => {
        const mailService = new MailService(mockSES, sender, false);
        const reply = await mailService.sendEmail(textMessage, htmlMessage, subject, [toAddress]);
        expect(reply).toBe(false);
        expect(mockSES.sendEmail).toHaveBeenCalledTimes(0);
    });

    it('should return true is email is disabled', async () => {
        const mailService = new MailService(mockSES, sender, true);
        const reply = await mailService.sendEmail(textMessage, htmlMessage, subject, [toAddress]);
        expect(reply).toBe(true);
        expect(mockSES.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should call SES with expected payload', async () => {
        const expectedPayload = {
            Destination: {
                BccAddresses: [],
                CcAddresses: [],
                ToAddresses: [toAddress],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: htmlMessage,
                    },
                    Text: {
                        Charset: 'UTF-8',
                        Data: textMessage,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            ReplyToAddresses: [],
            Source: sender,
        };
        const mailService = new MailService(mockSES, sender, true);
        const reply = await mailService.sendEmail(textMessage, htmlMessage, subject, [toAddress]);
        expect(reply).toBe(true);
        expect(mockSES.sendEmail).toHaveBeenCalledTimes(1);
        expect(mockSES.sendEmail).toHaveBeenCalledWith(expectedPayload);
    });
});
