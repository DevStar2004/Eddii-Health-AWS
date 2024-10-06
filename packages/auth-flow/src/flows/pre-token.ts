import { getSubscription, getUser } from '@eddii-backend/dal';
import { PreTokenGenerationTriggerEvent } from 'aws-lambda';
import { getSecret } from '@eddii-backend/secrets';
import crypto from 'crypto';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';

export const handler = async (event: PreTokenGenerationTriggerEvent) => {
    const email = event.request.userAttributes.email.toLowerCase();
    const context = {
        kind: 'user',
        key: email,
    };
    try {
        const intercomSecretRaw = await getSecret(
            process.env['INTERCOM_IDENTITY_SECRET'],
        );
        const intercomIdentitySecret = JSON.parse(intercomSecretRaw);
        if (intercomIdentitySecret?.iosSecret) {
            const iosHash = crypto
                .createHmac('sha256', intercomIdentitySecret.iosSecret)
                .update(email)
                .digest('hex');
            event.response = {
                ...event.response,
                claimsOverrideDetails: {
                    ...event.response?.claimsOverrideDetails,
                    claimsToAddOrOverride: {
                        ...event.response?.claimsOverrideDetails
                            ?.claimsToAddOrOverride,
                        intercom_ios_hash: iosHash,
                    },
                },
            };
        }
        if (intercomIdentitySecret?.androidSecret) {
            const androidHash = crypto
                .createHmac('sha256', intercomIdentitySecret.androidSecret)
                .update(email)
                .digest('hex');
            event.response = {
                ...event.response,
                claimsOverrideDetails: {
                    ...event.response?.claimsOverrideDetails,
                    claimsToAddOrOverride: {
                        ...event.response?.claimsOverrideDetails
                            ?.claimsToAddOrOverride,
                        intercom_android_hash: androidHash,
                    },
                },
            };
        }
    } catch (error) {
        console.error(error);
    }

    const subscription = await getSubscription(email);
    const now = new Date();
    if (subscription) {
        // Add a little buffer time to end date
        const endDate = new Date(subscription.endDate);
        endDate.setTime(endDate.getTime() + 5 * 60 * 1000);
        if (now < endDate) {
            event.response = {
                ...event.response,
                claimsOverrideDetails: {
                    ...event.response?.claimsOverrideDetails,
                    claimsToAddOrOverride: {
                        ...event.response?.claimsOverrideDetails
                            ?.claimsToAddOrOverride,
                        subscription_id: subscription.subscriptionId,
                    },
                },
            };
        }
    } else {
        try {
            const launchdarklySecret = await getSecret(
                process.env['LAUNCH_DARKLY_SECRET'],
            );
            const user = await getUser(email);
            const launchDarkly =
                await Clients.getLaunchDarkly(launchdarklySecret);
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
                if (now < endDate) {
                    // Backfill free trial users.
                    event.response = {
                        ...event.response,
                        claimsOverrideDetails: {
                            ...event.response?.claimsOverrideDetails,
                            claimsToAddOrOverride: {
                                ...event.response?.claimsOverrideDetails
                                    ?.claimsToAddOrOverride,
                                subscription_id: 'eddii.freetrial',
                            },
                        },
                    };
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    return event;
};
