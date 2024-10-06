import {
    registerDevice,
    listDevices,
    unregisterDevice,
    createUserTopic,
    createPlatformEndpoint,
    deletePlatformEndpoint,
    subscribeEndpointToTopic,
    unsubscribeEndpointToTopic,
    addSnsEndpointsToDevice,
    doesDeviceExist,
    extendDeviceExpiration,
    getDeviceByPlatformEndpointArn,
} from './device-dal';
import { Device } from './device-model';
import Clients from '@eddii-backend/clients';

process.env['PLATFORM_APPLICATION_ARN'] = 'test-platform-arn';

describe('device-dal', () => {
    it('should create a new SNS topic for the user', async () => {
        const email = 'johndoe@example.com';

        jest.mock('uuid', () => ({
            v4: jest.fn(() => 'UUID'),
        }));

        const topicArn = 'arn:aws:sns:us-east-1:123456789012:UUID';

        const sendMock = (Clients.sns.send as jest.Mock).mockResolvedValue({
            TopicArn: topicArn,
        });

        const createdTopic = await createUserTopic(email);

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(createdTopic).toEqual(topicArn);
    });

    it('should create a platform endpoint for the device', async () => {
        const device: Device = {
            email: 'test@example.com',
            deviceToken: 'test-token',
            deviceType: 'test-type',
        };

        const endpointArn = 'test-endpoint-arn';
        const sendMock = (Clients.sns.send as jest.Mock).mockResolvedValue({
            EndpointArn: endpointArn,
        });

        const createdEndpointArn = await createPlatformEndpoint(device);

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(createdEndpointArn).toEqual(endpointArn);
    });

    it('should delete a platform endpoint', async () => {
        const device: Device = {
            email: 'test@example.com',
            deviceToken: 'test-token',
            deviceType: 'test-type',
            platformEndpointArn: 'test-endpoint-arn',
        };

        const sendMock = (Clients.sns.send as jest.Mock).mockResolvedValue({});

        await deletePlatformEndpoint(device);

        expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('should subscribe a platform endpoint to a user topic', async () => {
        const platformEndpointArn = 'test-endpoint-arn';
        const userTopicArn = 'test-topic-arn';

        const sendMock = (Clients.sns.send as jest.Mock).mockResolvedValue({
            SubscriptionArn: 'test-subscription-arn',
        });

        const subscriptionArn = await subscribeEndpointToTopic(
            platformEndpointArn,
            userTopicArn,
        );

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(subscriptionArn).toEqual('test-subscription-arn');
    });

    it('should unsubscribe a platform endpoint from a user topic', async () => {
        const device: Device = {
            email: 'test@example.com',
            deviceToken: 'test-token',
            deviceType: 'test-type',
            platformEndpointArn: 'test-endpoint-arn',
            userTopicSubscriptionArn: 'test-subscription-arn',
        };

        const sendMock = (Clients.sns.send as jest.Mock).mockResolvedValue({});

        await unsubscribeEndpointToTopic(device);

        expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('should register a device', async () => {
        const deviceToken = 'deviceToken';
        const email = 'email';
        const deviceType = 'deviceType';

        const calledSpy = (
            Clients.dynamo.put({} as any).promise as jest.Mock
        ).mockResolvedValue({});

        await registerDevice(deviceToken, email, deviceType);

        expect(calledSpy).toHaveBeenCalled();
    });

    it('should add SNS endpoints to a device', async () => {
        const email = 'test@example.com';
        const deviceToken = 'test-token';
        const platformEndpointArn = 'test-endpoint-arn';
        const userTopicSubscriptionArn = 'test-subscription-arn';

        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockResolvedValue({});

        await addSnsEndpointsToDevice(
            email,
            deviceToken,
            platformEndpointArn,
            userTopicSubscriptionArn,
        );

        expect(calledSpy).toHaveBeenCalled();
    });

    it('should extend expiration to a device', async () => {
        const email = 'test@example.com';
        const deviceToken = 'test-token';

        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockResolvedValue({});

        await extendDeviceExpiration(email, deviceToken);

        expect(calledSpy).toHaveBeenCalled();
    });

    it('should list devices', async () => {
        const email = 'email';

        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: [
                {
                    email,
                    deviceToken: 'deviceToken1',
                    deviceType: 'deviceType1',
                },
                {
                    email,
                    deviceToken: 'deviceToken2',
                    deviceType: 'deviceType2',
                },
            ],
        });

        const devices = await listDevices(email);

        expect(calledSpy).toHaveBeenCalled();
        expect(devices).toEqual([
            {
                email,
                deviceToken: 'deviceToken1',
                deviceType: 'deviceType1',
            },
            {
                email,
                deviceToken: 'deviceToken2',
                deviceType: 'deviceType2',
            },
        ]);
    });

    it('should unregister a device', async () => {
        const deviceToken = 'deviceToken';
        const email = 'email';

        const calledSpy = (
            Clients.dynamo.delete({} as any).promise as jest.Mock
        ).mockResolvedValue({});

        await unregisterDevice(deviceToken, email);

        expect(calledSpy).toHaveBeenCalled();
    });

    it('should return true if the device exists', async () => {
        const email = 'test@example.com';
        const deviceToken = 'test-token';

        const calledSpy = (
            Clients.dynamo.get({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Item: {
                email: { S: email },
                deviceToken: { S: deviceToken },
            },
        });

        const result = await doesDeviceExist(email, deviceToken);

        expect(calledSpy).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('should return if the device exists via platform', async () => {
        const email = 'test@example.com';
        const deviceToken = 'test-token';
        const platform = 'test-platform';

        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: [
                {
                    email: { S: email },
                    deviceToken: { S: deviceToken },
                    platformEndpointArn: { S: platform },
                },
            ],
        });

        const result = await getDeviceByPlatformEndpointArn(platform);

        expect(calledSpy).toHaveBeenCalled();
        expect(result).toBeDefined();
    });

    it('should return false if the device does not exist', async () => {
        const email = 'test@example.com';
        const deviceToken = 'test-token';

        const calledSpy = (
            Clients.dynamo.get({} as any).promise as jest.Mock
        ).mockResolvedValue({});

        const result = await doesDeviceExist(email, deviceToken);

        expect(calledSpy).toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should return undefined if the device does not exists via platform', async () => {
        const platform = 'test-platform';

        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({ Items: [] });

        const result = await getDeviceByPlatformEndpointArn(platform);

        expect(calledSpy).toHaveBeenCalled();
        expect(result).toBe(undefined);
    });
});
