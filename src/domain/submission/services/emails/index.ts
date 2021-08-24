export const submittedEmail = (firstName = '', title = ''): { html: string; text: string } => {
    return {
        html: `<p>Dear ${firstName},</p>
        <p>Thank you for submitting your work, "${title}", to eLife using our new initial submission interface.</p>
        <p>You will hear from us again shortly once your submission has undergone quality checks, at which point you will receive a link to track the progress of your submission in a different system, which we use for evaluation and tracking.</p>

        <p>Best wishes,<p>
        <p>Nicola<p>
        <p>Nicola Adamson (Editorial Assistant)</p>
        <p>
        eLife Sciences Publications, Ltd is a limited liability non-profit non-stock corporation incorporated in the State of Delaware, USA, with company number 5030732, and is registered in the UK with company number FC030576 and branch number BR015634 at the address, Westbrook Centre, Milton Road, Cambridge CB4 1YG.
        </p>
        <p>
        You are receiving this email because you have been identified as the corresponding author of a submission to eLife. If this isn't you please contact editorial@elifesciences.org
        </p>`,
        text: `Dear ${firstName},
        Thank you for submitting your work, "${title}", to eLife using our new initial submission interface.

        You will hear from us again shortly once your submission has undergone quality checks, at which point you will receive a link to track the progress of your submission in a different system, which we use for evaluation and tracking.

        Best wishes,

        Nicola

        Nicola Adamson (Editorial Assistant)

        eLife Sciences Publications, Ltd is a limited liability non-profit non-stock corporation incorporated in the State of Delaware, USA, with company number 5030732, and is registered in the UK with company number FC030576 and branch number BR015634 at the address, Westbrook Centre, Milton Road, Cambridge CB4 1YG.

        You are receiving this email because you have been identified as the corresponding author of a submission to eLife. If this isn't you please contact editorial@elifesciences.org.`,
    };
};
