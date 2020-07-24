import * as SES from 'aws-sdk/clients/ses';

export class MailService {
    ses: SES;
    sender: string;
    sendmail: boolean;

    constructor(s3: SES, sender: string, sendmail: boolean) {
        this.ses = s3;
        this.sender = sender;
        this.sendmail = sendmail;
    }

    async sendEmail(
        textMessage: string,
        html: string,
        subject: string,
        to: string[],
        cc: string[] = [],
        bcc: string[] = [],
    ): Promise<boolean> {
        if (this.sendmail === false) {
            return false;
        }

        const params = {
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
            Source: this.sender,
        };
        await this.ses.sendEmail(params);
        return true;
    }
}
