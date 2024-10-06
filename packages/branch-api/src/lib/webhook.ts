import { Request, Response } from 'lambda-api';
import { createReferral } from '@eddii-backend/dal';
import { validEmail, validateAndNormalizeEmail } from '@eddii-backend/utils';
import { getSecret } from '@eddii-backend/secrets';

export const completeRegistrationWebhook = async (
    request: Request,
    response: Response,
): Promise<void> => {
    if (!request.body) {
        response.status(400).json({ error: 'Missing body.' });
        return;
    }
    const { name, user_data, last_attributed_touch_data } = request.body;
    console.log('Received request', JSON.stringify(request.body));
    if (name !== 'COMPLETE_REGISTRATION') {
        // Skip if not a registration event
        response.status(202).json({ message: 'Acknowledged' });
        return;
    }
    if (!last_attributed_touch_data) {
        response.status(202).json({ message: 'Acknowledged' });
        return;
    }
    const stage = last_attributed_touch_data.stage;
    if (stage !== process.env['ENV']) {
        // Skip if different stage
        response.status(202).json({ message: 'Acknowledged' });
        return;
    }
    const branchSecret = await getSecret(process.env['BRANCH_API_SECRET']);
    const authorization = request.headers['x-branch-auth'];
    if (authorization !== branchSecret) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (last_attributed_touch_data['~feature'] !== 'referrals') {
        response.status(202).json({ message: 'Acknowledged' });
        return;
    }
    let referredEmail = user_data.developer_identity;
    let referringEmail = last_attributed_touch_data.referringEmail;
    if (!validEmail(referredEmail) || !validEmail(referringEmail)) {
        response.status(202).json({ message: 'Acknowledged' });
        return;
    }
    referredEmail = validateAndNormalizeEmail(referredEmail);
    referringEmail = validateAndNormalizeEmail(referringEmail);
    if (referringEmail === referredEmail) {
        response.status(202).json({ message: 'Acknowledged' });
        return;
    }

    try {
        await createReferral(referringEmail, referredEmail);
        response.status(200).json({ message: 'Acknowledged' });
    } catch (e) {
        response.status(500).json({ error: 'Error creating referral.' });
    }
};
