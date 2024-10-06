import { Request, Response } from 'lambda-api';
import {
    getSubscription as getSubscriptionFromDal,
    createSubscription as createSubscriptionFromDal,
    SubscriptionPlatform,
    getSubscriptionByTxId,
    Subscription,
    AppleSubscription,
    getUser,
    GoogleSubscription,
} from '@eddii-backend/dal';
import { isValidReceipt, processPurchase } from '@eddii-backend/purchases';
import { getSecret } from '@eddii-backend/secrets';
import Clients from '@eddii-backend/clients';

export const getSubscription = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const context = {
        kind: 'user',
        key: email,
    };
    const subscription = await getSubscriptionFromDal(email);
    if (!subscription) {
        const user = await getUser(email);

        const launchdarklySecret = await getSecret(
            process.env['LAUNCH_DARKLY_SECRET'],
        );
        const launchDarkly = await Clients.getLaunchDarkly(launchdarklySecret);
        const flag = await launchDarkly.variation(
            'noCreditCardFreeTrial',
            context,
            false,
        );

        if (!flag) {
            const createdAt = new Date(user.createdAt);
            const endDate = new Date(
                createdAt.getTime() + 7 * 24 * 60 * 60 * 1000,
            );
            // Backfill free trial users.
            response.status(200).json({
                email: email,
                startDate: user.createdAt,
                endDate: endDate.toISOString(),
                subscriptionId: 'eddii.freetrial',
            });
            return;
        } else {
            response.status(404).json({ message: 'No subscription found' });
            return;
        }
    }
    if (subscription?.endDate) {
        // Add grace period
        subscription.endDate = new Date(
            new Date(subscription.endDate).getTime() + 5 * 60 * 1000,
        ).toISOString();
    }
    response.status(200).json(subscription);
};

export const canCreateSubscription = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const txId = request.body.txId;
    if (!txId) {
        response.status(400).json({ message: 'Missing txId.' });
        return;
    }
    const subscriptionForTxId = await getSubscriptionByTxId(txId);
    let canSubscribe = true;
    if (subscriptionForTxId && subscriptionForTxId.email !== email) {
        canSubscribe = false;
    }
    response.status(200).json({ canSubscribe: canSubscribe });
};

export const createSubscription = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const receipt = request.body.receipt;
    if (!receipt) {
        response.status(400).json({ message: 'Missing receipt.' });
        return;
    }
    const platform = request.body.platform;
    if (!platform) {
        response.status(400).json({ message: 'Missing platform.' });
        return;
    }
    if (
        platform !== SubscriptionPlatform.ios &&
        platform !== SubscriptionPlatform.android
    ) {
        response.status(400).json({ message: 'Invalid platform.' });
        return;
    }
    let subscriptionToCreate: Subscription;

    let appleSharedSecret = undefined;
    let googlePrivateKey = undefined;

    if (platform === SubscriptionPlatform.ios) {
        appleSharedSecret = await getSecret(process.env['APPLE_SHARED_SECRET']);
    } else if (platform === SubscriptionPlatform.android) {
        googlePrivateKey = await getSecret(process.env['GOOGLE_PRIVATE_KEY']);
    }
    if (!(await isValidReceipt(receipt, appleSharedSecret, googlePrivateKey))) {
        response.status(400).json({ message: 'Invalid receipt.' });
        return;
    }
    const purchase = await processPurchase(
        platform,
        receipt,
        appleSharedSecret,
        googlePrivateKey,
    );
    if (!purchase) {
        response
            .status(400)
            .json({ message: 'Invalid receipt, no purchase found.' });
        return;
    }
    if (purchase.isCancelled || purchase.isExpired) {
        response.status(400).json({
            message: 'Invalid receipt, purchase is cancelled or expired.',
        });
        return;
    }
    const subscriptionForTxId = await getSubscriptionByTxId(purchase.txId);
    if (subscriptionForTxId && subscriptionForTxId.email !== email) {
        response.status(400).json({
            message:
                'Invalid receipt, subscription already exists for this transaction.',
        });
        return;
    }

    if (platform === SubscriptionPlatform.ios) {
        subscriptionToCreate = new AppleSubscription(
            email,
            purchase.startDate,
            purchase.endDate,
            purchase.productId,
            purchase.txId,
        );
    } else if (platform === SubscriptionPlatform.android) {
        subscriptionToCreate = new GoogleSubscription(
            email,
            purchase.startDate,
            purchase.endDate,
            purchase.productId,
            purchase.txId,
        );
    }

    const subscription = await createSubscriptionFromDal(subscriptionToCreate);
    response.status(200).json(subscription);
};
