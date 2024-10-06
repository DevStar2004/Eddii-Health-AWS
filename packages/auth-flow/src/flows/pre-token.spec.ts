import { getSecret } from '@eddii-backend/secrets';
import { handler } from './pre-token';
import { getSubscription, getUser } from '@eddii-backend/dal';
import Clients from '@eddii-backend/clients';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/secrets');
jest.mock('@eddii-backend/flags');

process.env['INTERCOM_IDENTITY_SECRET'] = 'test-secret';

describe('pre-token handler', () => {
    let event;

    beforeEach(() => {
        (getSecret as jest.Mock).mockResolvedValue(
            JSON.stringify({
                iosSecret: 'testIos',
                androidSecret: 'testAndroid',
            }),
        );
        event = {
            request: {
                userAttributes: {
                    email: 'test@example.com',
                },
            },
            response: {},
        };
    });

    it('should add subscriptionProductId to claims if subscription is active', async () => {
        (getSubscription as jest.Mock).mockResolvedValue({
            endDate: new Date(Date.now() + 10000),
            subscriptionId: 'test-id',
        });

        const result = await handler(event);

        expect(result.response).toEqual({
            claimsOverrideDetails: {
                claimsToAddOrOverride: {
                    intercom_android_hash:
                        'a53897efc4982eefc569edf6ac212d2779887c7fdceb4f607f9e7b576ffb4e4a',
                    intercom_ios_hash:
                        '0a7d264ae7d2c3fb6d5b8825822f15c69a23580537bfb313f577e9567f0f329a',
                    subscription_id: 'test-id',
                },
            },
        });
    });

    it('should add subscriptionProductId to claims if subscription is expired inside of grace', async () => {
        (getSubscription as jest.Mock).mockResolvedValue({
            endDate: new Date(Date.now() - 2 * 60 * 1000),
            subscriptionId: 'test-id',
        });

        const result = await handler(event);

        expect(result.response).toEqual({
            claimsOverrideDetails: {
                claimsToAddOrOverride: {
                    intercom_android_hash:
                        'a53897efc4982eefc569edf6ac212d2779887c7fdceb4f607f9e7b576ffb4e4a',
                    intercom_ios_hash:
                        '0a7d264ae7d2c3fb6d5b8825822f15c69a23580537bfb313f577e9567f0f329a',
                    subscription_id: 'test-id',
                },
            },
        });
    });

    it('should not add subscriptionProductId to claims if subscription is expired outside of grace', async () => {
        (getSubscription as jest.Mock).mockResolvedValue({
            endDate: new Date(Date.now() - 8 * 60 * 1000),
            subscriptionId: 'test-product-id',
        });

        const result = await handler(event);

        expect(result.response).toEqual({
            claimsOverrideDetails: {
                claimsToAddOrOverride: {
                    intercom_android_hash:
                        'a53897efc4982eefc569edf6ac212d2779887c7fdceb4f607f9e7b576ffb4e4a',
                    intercom_ios_hash:
                        '0a7d264ae7d2c3fb6d5b8825822f15c69a23580537bfb313f577e9567f0f329a',
                },
            },
        });
    });

    //it('should not add subscriptionProductId to claims if no subscription and after 14 day trial', async () => {
    //    (getSubscription as jest.Mock).mockResolvedValue(null);
    //    (getUser as jest.Mock).mockResolvedValue({
    //        email: 'test@example.com',
    //        createdAt: '2023-10-14',
    //    });

    //    const result = await handler(event);

    //    expect(result.response).toEqual({
    //        claimsOverrideDetails: {
    //            claimsToAddOrOverride: {
    //                intercom_android_hash:
    //                    'a53897efc4982eefc569edf6ac212d2779887c7fdceb4f607f9e7b576ffb4e4a',
    //                intercom_ios_hash:
    //                    '0a7d264ae7d2c3fb6d5b8825822f15c69a23580537bfb313f577e9567f0f329a',
    //            },
    //        },
    //    });
    //});

    it('should add subscriptionProductId to claims if no subscription and in trial', async () => {
        (getSubscription as jest.Mock).mockResolvedValue(null);
        (getUser as jest.Mock).mockResolvedValue({
            email: 'test@example.com',
            createdAt: '2023-10-29',
        });
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2023, 10, 1));
        const ld = await Clients.getLaunchDarkly();
        (ld.variation as jest.Mock).mockResolvedValue(false);

        const result = await handler(event);

        expect(result.response).toEqual({
            claimsOverrideDetails: {
                claimsToAddOrOverride: {
                    intercom_android_hash:
                        'a53897efc4982eefc569edf6ac212d2779887c7fdceb4f607f9e7b576ffb4e4a',
                    intercom_ios_hash:
                        '0a7d264ae7d2c3fb6d5b8825822f15c69a23580537bfb313f577e9567f0f329a',
                    subscription_id: 'eddii.freetrial',
                },
            },
        });

        jest.useRealTimers();
    });

    it('should not add subscriptionProductId to claims if no subscription and credit-card trial', async () => {
        (getSubscription as jest.Mock).mockResolvedValue(null);
        (getUser as jest.Mock).mockResolvedValue({
            email: 'test@example.com',
            createdAt: '2023-10-29',
        });
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2023, 10, 1));
        const ld = await Clients.getLaunchDarkly();
        (ld.variation as jest.Mock).mockResolvedValue(true);

        const result = await handler(event);

        expect(result.response).toEqual({
            claimsOverrideDetails: {
                claimsToAddOrOverride: {
                    intercom_android_hash:
                        'a53897efc4982eefc569edf6ac212d2779887c7fdceb4f607f9e7b576ffb4e4a',
                    intercom_ios_hash:
                        '0a7d264ae7d2c3fb6d5b8825822f15c69a23580537bfb313f577e9567f0f329a',
                },
            },
        });

        jest.useRealTimers();
    });
});
