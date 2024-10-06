import {
    addSnsEndpointsToDevice,
    createPlatformEndpoint,
    deletePlatformEndpoint,
    getUser,
    subscribeEndpointToTopic,
    unregisterDevice,
    unsubscribeEndpointToTopic,
} from '@eddii-backend/dal';
import { handler } from './device-management';
import { DynamoDBStreamEvent } from 'aws-lambda';
import * as zlib from 'zlib';
import { promisify } from 'util';
const gzipAsync = promisify(zlib.gzip);

// Mock out the @eddii-backend/dal module
jest.mock('@eddii-backend/dal', () => ({
    addSnsEndpointsToDevice: jest.fn(),
    createPlatformEndpoint: jest.fn().mockResolvedValue('test-platform-arn'),
    deletePlatformEndpoint: jest.fn(),
    getUser: jest.fn().mockResolvedValue({ userTopicArn: 'test-topic-arn' }),
    subscribeEndpointToTopic: jest
        .fn()
        .mockResolvedValue('test-subscription-arn'),
    unsubscribeEndpointToTopic: jest.fn(),
    getDeviceByPlatformEndpointArn: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        deviceToken: 'test-device-token',
        platformEndpointArn: 'test-platform-arn',
        userTopicSubscriptionArn: 'test-subscription-arn',
    }),
    unregisterDevice: jest.fn(),
}));

describe('device-management', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should handle INSERT events', async () => {
        const event: DynamoDBStreamEvent = {
            Records: [
                {
                    eventID: '1',
                    eventName: 'INSERT',
                    dynamodb: {
                        NewImage: {
                            email: { S: 'test@example.com' },
                            deviceToken: { S: 'test-device-token' },
                        },
                    },
                },
            ],
        };

        await handler(event);

        expect(createPlatformEndpoint).toBeCalledWith({
            email: 'test@example.com',
            deviceToken: 'test-device-token',
        });
        expect(getUser).toBeCalledWith('test@example.com');
        expect(subscribeEndpointToTopic).toBeCalledWith(
            'test-platform-arn',
            'test-topic-arn',
        );
        expect(addSnsEndpointsToDevice).toBeCalledWith(
            'test@example.com',
            'test-device-token',
            'test-platform-arn',
            'test-subscription-arn',
        );
    });

    it('should handle REMOVE events', async () => {
        const event: DynamoDBStreamEvent = {
            Records: [
                {
                    eventID: '1',
                    eventName: 'REMOVE',
                    dynamodb: {
                        OldImage: {
                            email: { S: 'test@example.com' },
                            deviceToken: { S: 'test-device-token' },
                            platformEndpointArn: { S: 'test-platform-arn' },
                            userTopicSubscriptionArn: {
                                S: 'test-subscription-arn',
                            },
                        },
                    },
                },
            ],
        };

        await handler(event);

        expect(deletePlatformEndpoint).toBeCalledWith({
            email: 'test@example.com',
            deviceToken: 'test-device-token',
            userTopicSubscriptionArn: 'test-subscription-arn',
            platformEndpointArn: 'test-platform-arn',
        });
        expect(unsubscribeEndpointToTopic).toBeCalledWith({
            email: 'test@example.com',
            deviceToken: 'test-device-token',
            userTopicSubscriptionArn: 'test-subscription-arn',
            platformEndpointArn: 'test-platform-arn',
        });
    });

    it('should handle CloudWatch Log Event with NotRegistered', async () => {
        const event = {
            awslogs: {
                data: Buffer.from(
                    await gzipAsync(
                        JSON.stringify({
                            logEvents: [
                                {
                                    message: JSON.stringify({
                                        status: 'FAILURE',
                                        delivery: {
                                            destination: 'test-platform-arn',
                                            providerResponse:
                                                '{"error":"NotRegistered"}',
                                        },
                                    }),
                                },
                            ],
                        }),
                    ),
                ).toString('base64'),
            },
        };

        await handler(event);

        expect(deletePlatformEndpoint).toBeCalledWith({
            email: 'test@example.com',
            deviceToken: 'test-device-token',
            userTopicSubscriptionArn: 'test-subscription-arn',
            platformEndpointArn: 'test-platform-arn',
        });
        expect(unsubscribeEndpointToTopic).toBeCalledWith({
            email: 'test@example.com',
            deviceToken: 'test-device-token',
            userTopicSubscriptionArn: 'test-subscription-arn',
            platformEndpointArn: 'test-platform-arn',
        });
    });

    it('should handle CloudWatch Log Event with InvalidRegistration', async () => {
        const event = {
            awslogs: {
                data: Buffer.from(
                    await gzipAsync(
                        JSON.stringify({
                            logEvents: [
                                {
                                    message: JSON.stringify({
                                        status: 'FAILURE',
                                        delivery: {
                                            destination: 'test-platform-arn',
                                            providerResponse:
                                                '{"error":"InvalidRegistration"}',
                                        },
                                    }),
                                },
                            ],
                        }),
                    ),
                ).toString('base64'),
            },
        };

        await handler(event);

        expect(deletePlatformEndpoint).toBeCalledWith({
            email: 'test@example.com',
            deviceToken: 'test-device-token',
            userTopicSubscriptionArn: 'test-subscription-arn',
            platformEndpointArn: 'test-platform-arn',
        });
        expect(unsubscribeEndpointToTopic).toBeCalledWith({
            email: 'test@example.com',
            deviceToken: 'test-device-token',
            userTopicSubscriptionArn: 'test-subscription-arn',
            platformEndpointArn: 'test-platform-arn',
        });
        expect(unregisterDevice).toBeCalledWith(
            'test@example.com',
            'test-device-token',
        );
    });

    it('should handle CloudWatch Log Event with endpoint disabled', async () => {
        const event = {
            awslogs: {
                data: Buffer.from(
                    await gzipAsync(
                        JSON.stringify({
                            logEvents: [
                                {
                                    message: JSON.stringify({
                                        status: 'FAILURE',
                                        delivery: {
                                            destination: 'test-platform-arn',
                                            providerResponse:
                                                'Endpoint is disabled: Some other stuff',
                                        },
                                    }),
                                },
                            ],
                        }),
                    ),
                ).toString('base64'),
            },
        };

        await handler(event);

        expect(deletePlatformEndpoint).toBeCalledWith({
            email: 'test@example.com',
            deviceToken: 'test-device-token',
            userTopicSubscriptionArn: 'test-subscription-arn',
            platformEndpointArn: 'test-platform-arn',
        });
        expect(unsubscribeEndpointToTopic).toBeCalledWith({
            email: 'test@example.com',
            deviceToken: 'test-device-token',
            userTopicSubscriptionArn: 'test-subscription-arn',
            platformEndpointArn: 'test-platform-arn',
        });
        expect(unregisterDevice).toBeCalledWith(
            'test@example.com',
            'test-device-token',
        );
    });

    it('should handle CloudWatch Log Event with not failure ', async () => {
        const event = {
            awslogs: {
                data: Buffer.from(
                    await gzipAsync(
                        JSON.stringify({
                            logEvents: [
                                {
                                    message: JSON.stringify({
                                        status: 'SUCCESS',
                                        delivery: {
                                            destination: 'test-platform-arn',
                                            providerResponse: 'Hello',
                                        },
                                    }),
                                },
                            ],
                        }),
                    ),
                ).toString('base64'),
            },
        };

        await handler(event);

        expect(deletePlatformEndpoint).not.toBeCalled();
        expect(unsubscribeEndpointToTopic).not.toBeCalled();
        expect(unregisterDevice).not.toBeCalled();
    });
});
