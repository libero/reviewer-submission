import * as SES from 'aws-sdk/clients/ses';

export class MailService {
    ses: SES;

    constructor(s3: SES) {
        this.ses = s3;
    }

    async sendEmail(
        textMessage: string,
        html: string,
        subject: string,
        to: string[],
        cc: string[] = [],
        bcc: string[] = [],
    ): Promise<void> {

        // after much discussion, it was decided to have a send email config to bypass sending.

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
