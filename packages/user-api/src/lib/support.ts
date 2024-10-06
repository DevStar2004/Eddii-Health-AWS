import { Request, Response } from 'lambda-api';
import { sendSupportEmail as sendSupportEmailViaSes } from '@eddii-backend/email';
import { validArbitraryString } from '@eddii-backend/utils';

export const sendSupportEmail = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    if (!request.body.reason || !validArbitraryString(request.body.reason)) {
        response.status(400).json({ message: 'Valid Reason is required.' });
        return;
    }
    if (
        !request.body.reasonText ||
        !validArbitraryString(request.body.reasonText)
    ) {
        response
            .status(400)
            .json({ message: 'Valid Reason Text is required.' });
        return;
    }
    await sendSupportEmailViaSes(
        email,
        'eddii Support Request Received',
        `Thank you for contacting eddii support. We will respond to your request as soon as possible.\n\n` +
            `-----------------------\n\n` +
            `Request: ${request.body.reason}\n\n` +
            `Description: ${request.body.reasonText}\n\n` +
            `eddii Support Team`,
    );
    response.status(200).json({ message: 'Support request sent.' });
};
