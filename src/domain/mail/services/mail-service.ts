import * as SES from 'aws-sdk/clients/ses';

export class MailService {
    ses: SES;

    constructor(s3: SES) {
        this.ses = s3;
    }

    async sendEmail(
        subject: string,
        to: string[],
        cc: string[] = [],
        bcc: string[] = [],
        textMessage: string,
        html: string,
    ): Promise<void> {
        var params = {
            Destination: {
                BccAddresses: bcc,
                CcAddresses: cc,
                ToAddresses: to,
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: html,
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
            Source: 'sender@example.com', // pull from config
        };
        await this.ses.sendEmail(params);
    }
}
