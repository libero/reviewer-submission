import * as SES from 'aws-sdk/clients/ses';

import { InfraLogger as logger } from '../../../logger';

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
        logger.info('sending email');
        if (this.sendmail === false) {
            logger.warn('emails are not enabled');
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

        try {
            await this.ses.sendEmail(params).promise();
            logger.info('email sent');
            return true;
        } catch (e) {
            logger.error('email failed to send', e);
            return false;
        }
    }
}
