import { Request, Response } from 'lambda-api';
import {
    NotificationType,
    decodeNotificationPayload,
    decodeRenewalInfo,
    decodeTransaction,
} from 'app-store-server-api';
import {
    AppleSubscription,
    GoogleSubscription,
    createSubscription,
    getSubscriptionByTxId,
} from '@eddii-backend/dal';
import { OAuth2Client, JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { getSecret } from '@eddii-backend/secrets';

const APP_PRODUCT_IDS = {
    dev: 'com.eddiihealth.eddii.dev',
    sandbox: 'com.eddiihealth.eddii.sandbox',
    staging: 'com.eddiihealth.eddii.staging',
    prod: 'com.eddiihealth.eddii',
};

const GOOGLE_PLAY_RECEIPT_VALIDATOR_EMAILS = {
    dev: 'receipt-validator@eddii-dev.iam.gserviceaccount.com',
    sandbox: 'receipt-validator@eddii-sandbox.iam.gserviceaccount.com',
    staging: 'receipt-validator@eddii-staging.iam.gserviceaccount.com',
    prod: 'receipt-validator@eddii-prod.iam.gserviceaccount.com',
};

const GOOGLE_PLAY_RTDN_AUTH_EMAILS = {
    dev: 'rtdn-auth@eddii-dev.iam.gserviceaccount.com',
    sandbox: 'rtdn-auth@eddii-sandbox.iam.gserviceaccount.com',
    staging: 'rtdn-auth@eddii-staging.iam.gserviceaccount.com',
    prod: 'rtdn-auth@eddii-prod.iam.gserviceaccount.com',
};

const authClient = new OAuth2Client();

const NOTIFICATION_TYPES_FOR_NON_SUBSCRIPTION_PURCHASES = new Set([
    NotificationType.ConsumptionRequest,
]);

export const appleWebhook = async (
    request: Request,
    response: Response,
): Promise<void> => {
    if (!request.body) {
        response.status(400).json({ error: 'Missing body.' });
        return;
    }
    const data = request.body as Record<string, unknown>;
    const signedPayload = data.signedPayload as string;
    if (typeof signedPayload !== 'string') {
        response.status(500).json({ error: 'Invalid Signed Payload.' });
        return;
    }
    try {
        const decodedPayload = await decodeNotificationPayload(signedPayload);
        console.log(
            `Received Apple Server Notification: ${JSON.stringify(
                decodedPayload,
            )}`,
        );
        // Type-guard to ensure the notification is for a subscription
        if (
            NOTIFICATION_TYPES_FOR_NON_SUBSCRIPTION_PURCHASES.has(
                decodedPayload.notificationType,
            )
        ) {
            response.status(200).json({ message: 'Acknowledged' });
            return;
        }

        const transaction = await decodeTransaction(
            decodedPayload.data.signedTransactionInfo,
        );
        console.log(`Transaction: ${JSON.stringify(transaction)}`);
        const renewalInfo = await decodeRenewalInfo(
            decodedPayload.data.signedRenewalInfo,
        );
        console.log(`Renewal Info: ${JSON.stringify(renewalInfo)}`);

        if (transaction.bundleId !== APP_PRODUCT_IDS[process.env['ENV']]) {
            response.status(401).json({ error: 'Incorrect Apple Bundle ID.' });
            return;
        }

        const currentSubscription = await getSubscriptionByTxId(
            transaction.originalTransactionId,
        );
        if (!currentSubscription) {
            response.status(404).json({ error: 'Subscription not found.' });
            return;
        }
        if (currentSubscription.platform !== 'ios') {
            response
                .status(400)
                .json({ error: 'Subscription is not an Apple subscription.' });
            return;
        }
        const appleSubscription = currentSubscription as AppleSubscription;

        // Update subscription dates
        if (transaction.expiresDate) {
            appleSubscription.endDate = new Date(
                transaction.expiresDate,
            ).toISOString();
        }

        // Update Apple-specific fields
        appleSubscription.latestNotificationType =
            decodedPayload.notificationType;
        appleSubscription.latestNotificationSubtype = decodedPayload.subtype;
        appleSubscription.status = decodedPayload.data.status;
        // Update renewal info
        appleSubscription.autoRenewStatus = renewalInfo.autoRenewStatus;
        appleSubscription.autoRenewProductId = renewalInfo.autoRenewProductId;
        appleSubscription.expirationIntent = renewalInfo.expirationIntent;
        appleSubscription.offerType = renewalInfo.offerType;
        // Update transaction info
        // Update product ID in case the plan changed
        appleSubscription.subscriptionId = transaction.productId;
        appleSubscription.revocationDate = transaction.revocationDate;
        appleSubscription.revocationReason = transaction.revocationReason;

        // Save subscription
        appleSubscription.lastSyncedDate = new Date().toISOString();
        await createSubscription(appleSubscription);
        response.status(200).json({ message: 'Acknowledged' });
        return;
    } catch (err) {
        if (err.message === 'Certificate validation failed') {
            response
                .status(401)
                .json({ error: 'Certificate validation failed.' });
            return;
        } else {
            console.error(err);
            response.status(500).json({ error: 'Unknown error.' });
            return;
        }
    }
};

export const googleWebhook = async (
    request: Request,
    response: Response,
): Promise<void> => {
    if (!request.body) {
        response.status(400).json({ error: 'Missing body.' });
        return;
    }
    if (!request.body.message?.data) {
        response.status(400).json({ error: 'Missing payload.' });
        return;
    }

    const authorization = request.headers.authorization;
    if (!authorization) {
        response.status(401).json({ error: 'Missing authorization header.' });
        return;
    }
    const [, token] = authorization.match(/Bearer (.*)/);
    if (!token) {
        response.status(401).json({ error: 'Missing authorization token.' });
        return;
    }

    try {
        const ticket = await authClient.verifyIdToken({
            idToken: token,
        });
        const claim = ticket.getPayload();
        if (
            claim.email_verified !== true ||
            claim.email !== GOOGLE_PLAY_RTDN_AUTH_EMAILS[process.env['ENV']]
        ) {
            throw new Error('Invalid authorization claim.');
        }
    } catch (err) {
        console.error(err);
        response.status(401).json({ error: 'Invalid authorization token.' });
        return;
    }

    const rawPayload = Buffer.from(
        request.body.message.data,
        'base64',
    ).toString('utf8');
    console.log(`Received Google Play RTDN: ${rawPayload}`);
    const developerNotification = JSON.parse(rawPayload);

    if (
        developerNotification.packageName !==
        APP_PRODUCT_IDS[process.env['ENV']]
    ) {
        response
            .status(401)
            .json({ error: 'Incorrect Google Play Package Name.' });
        return;
    }

    if (
        developerNotification.testNotification ||
        !developerNotification.subscriptionNotification ||
        // We can ignore expired subscriptions as it is already handled in the endDate logic and otherwise can overwrite the entry
        developerNotification.subscriptionNotification.notificationType === 13
    ) {
        response.status(200).json({ message: 'Acknowledged' });
        return;
    }
    const googlePrivateKey = await getSecret(process.env['GOOGLE_PRIVATE_KEY']);
    google.options({
        auth: new JWT(
            GOOGLE_PLAY_RECEIPT_VALIDATOR_EMAILS[process.env['ENV']],
            null,
            googlePrivateKey,
            ['https://www.googleapis.com/auth/androidpublisher'],
        ),
    });
    const androidGoogleApi = google.androidpublisher({ version: 'v3' });
    // Query google for the latest subscription info
    const googleSubscriptionInfo =
        await androidGoogleApi.purchases.subscriptionsv2.get({
            packageName: developerNotification.packageName,
            token: developerNotification.subscriptionNotification.purchaseToken,
        });
    console.log(
        `Google Subscription Info: ${JSON.stringify(
            googleSubscriptionInfo.data,
        )}`,
    );

    let currentSubscription = await getSubscriptionByTxId(
        developerNotification.subscriptionNotification.purchaseToken,
    );
    const linkedPurchaseToken =
        googleSubscriptionInfo?.data?.linkedPurchaseToken;
    if (!currentSubscription && linkedPurchaseToken) {
        // Check if linkedPuchaseToken exists
        currentSubscription = await getSubscriptionByTxId(linkedPurchaseToken);
    }
    if (!currentSubscription) {
        response.status(404).json({ error: 'Subscription not found.' });
        return;
    }
    if (currentSubscription.platform !== 'android') {
        response
            .status(400)
            .json({ error: 'Subscription is not an Android subscription.' });
        return;
    }
    const googleSubscription = currentSubscription as GoogleSubscription;
    googleSubscription.notificationType =
        developerNotification.subscriptionNotification.notificationType;
    if (linkedPurchaseToken) {
        googleSubscription.linkedPurchaseToken =
            googleSubscriptionInfo.data.linkedPurchaseToken;
        googleSubscription.txId =
            developerNotification.subscriptionNotification.purchaseToken;
    }
    googleSubscription.subscriptionState =
        googleSubscriptionInfo.data.subscriptionState;

    if (googleSubscriptionInfo.data?.lineItems?.length > 0) {
        const lineItem = googleSubscriptionInfo.data?.lineItems[0];
        if (lineItem.expiryTime) {
            googleSubscription.endDate = new Date(
                lineItem.expiryTime,
            ).toISOString();
        }
        googleSubscription.autoRenewingPlan =
            lineItem.autoRenewingPlan?.autoRenewEnabled;
        googleSubscription.offerId = lineItem.offerDetails?.offerId;
        if (lineItem.productId && lineItem.offerDetails?.basePlanId) {
            googleSubscription.subscriptionId = `${lineItem.productId}.${lineItem.offerDetails.basePlanId}`;
        }
    }

    googleSubscription.lastSyncedDate = new Date().toISOString();
    await createSubscription(googleSubscription);
    response.status(200).json({ message: 'Acknowledged' });
    return;
};
