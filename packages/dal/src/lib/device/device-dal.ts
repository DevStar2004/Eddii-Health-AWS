import { getDynamoClient } from '../../aws';
import { Device } from './device-model';
import {
    CreatePlatformEndpointCommand,
    CreateTopicCommand,
    DeleteEndpointCommand,
    DeleteTopicCommand,
    SubscribeCommand,
    UnsubscribeCommand,
} from '@aws-sdk/client-sns';
import Clients from '@eddii-backend/clients';
import { v4 as uuidv4 } from 'uuid';

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

export const createUserTopic = async (
    email: string,
): Promise<string | undefined> => {
    const snsClient = Clients.sns;
    const topicName = uuidv4();
    console.log(`Creating topic ${topicName} for ${email}`);
    try {
        const response = await snsClient.send(
            new CreateTopicCommand({
                Name: topicName,
                Attributes: { KmsMasterKeyId: 'alias/aws/sns' },
            }),
        );
        return response.TopicArn;
    } catch (error) {
        console.error(`Error creating topic ${topicName}: `, error);
        throw new Error('Error creating topic.');
    }
};

export const deleteUserTopic = async (userTopicArn: string): Promise<void> => {
    const snsClient = Clients.sns;
    console.log(`Deleting topic ${userTopicArn}`);
    try {
        await snsClient.send(
            new DeleteTopicCommand({
                TopicArn: userTopicArn,
            }),
        );
    } catch (error) {
        console.error(`Error deleting topic ${userTopicArn}: `, error);
        throw new Error('Error deleting topic.');
    }
};

export const createPlatformEndpoint = async (
    device: Device,
): Promise<string | undefined> => {
    if (!process.env['PLATFORM_APPLICATION_ARN']) {
        console.log(`No-op since PLATFORM_APPLICATION_ARN is not set`);
        return;
    }
    const snsClient = Clients.sns;
    console.log(`Creating platform endpoint for ${device.email}`);
    try {
        const response = await snsClient.send(
            new CreatePlatformEndpointCommand({
                PlatformApplicationArn: process.env['PLATFORM_APPLICATION_ARN'],
                Token: device.deviceToken,
                Attributes: {
                    UserId: device.email,
                },
            }),
        );
        return response.EndpointArn;
    } catch (error) {
        console.error(
            `Error creating platform endpoint for ${device.email}: `,
            error,
        );
        throw new Error('Error creating platform endpoint.');
    }
};

export const deletePlatformEndpoint = async (device: Device): Promise<void> => {
    if (!device.platformEndpointArn) {
        return;
    }
    const snsClient = Clients.sns;
    console.log(
        `Deleting platform endpoint ${device.platformEndpointArn} for ${device.email}`,
    );
    try {
        await snsClient.send(
            new DeleteEndpointCommand({
                EndpointArn: device.platformEndpointArn,
            }),
        );
    } catch (error) {
        console.error(
            `Error deleting platform endpoint for ${device.email}: `,
            error,
        );
        throw new Error('Error deleting platform endpoint.');
    }
};

export const subscribeEndpointToTopic = async (
    platformEndpointArn: string,
    userTopicArn: string,
): Promise<string | undefined> => {
    const snsClient = Clients.sns;
    console.log(`Subscribing ${platformEndpointArn} to ${userTopicArn}}`);
    try {
        const response = await snsClient.send(
            new SubscribeCommand({
                TopicArn: userTopicArn,
                Protocol: 'application',
                Endpoint: platformEndpointArn,
                Attributes: {
                    FilterPolicyScope: 'MessageAttributes',
                    FilterPolicy: JSON.stringify({
                        destination: ['push'],
                    }),
                },

                ReturnSubscriptionArn: true,
            }),
        );
        return response.SubscriptionArn;
    } catch (error) {
        console.error(
            `Error subscribing ${platformEndpointArn} to ${userTopicArn}}: `,
            error,
        );
        throw new Error('Error subscribing platform endpoint.');
    }
};

export const unsubscribeEndpointToTopic = async (
    device: Device,
): Promise<void> => {
    if (!device.userTopicSubscriptionArn) {
        return;
    }
    const snsClient = Clients.sns;
    console.log(
        `Unsubscribing ${device.userTopicSubscriptionArn} from ${device.email}`,
    );
    try {
        await snsClient.send(
            new UnsubscribeCommand({
                SubscriptionArn: device.userTopicSubscriptionArn,
            }),
        );
    } catch (error) {
        console.error(
            `Error unsubscribing ${device.userTopicSubscriptionArn} from ${device.email}: `,
            error,
        );
        throw new Error('Error unsubscribing platform endpoint.');
    }
};

export const registerDevice = async (
    email: string,
    deviceToken: string,
    deviceType: string,
): Promise<Device> => {
    console.log(`Registering ${deviceToken} to ${email}`);
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['DEVICE_TABLE_NAME'] as string,
        Item: {
            email: email,
            deviceToken: deviceToken,
            deviceType: deviceType,
            // Do one day so that if SNS flow fails it will try again
            expiresAt: Math.round(Date.now() / 1000) + ONE_DAY_IN_SECONDS,
        },
    };
    try {
        await ddbDocClient.put(params).promise();
        return {
            email: email,
            deviceToken: deviceToken,
            deviceType: deviceType,
        } as Device;
    } catch (e) {
        console.error(`Failed to register ${deviceToken} to ${email}`, e);
        throw new Error('Error registering device.');
    }
};

export const addSnsEndpointsToDevice = async (
    email: string,
    deviceToken: string,
    platformEndpointArn: string,
    userTopicSubscriptionArn: string,
): Promise<void> => {
    console.log(
        `Adding endpoints ${platformEndpointArn}:${userTopicSubscriptionArn} to ${email}`,
    );
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['DEVICE_TABLE_NAME'] as string,
        Key: {
            email: email,
            deviceToken: deviceToken,
        },
        UpdateExpression:
            'SET platformEndpointArn = :platformEndpointArn, userTopicSubscriptionArn = :userTopicSubscriptionArn, expiresAt = :expiresAt',
        ExpressionAttributeValues: {
            ':platformEndpointArn': platformEndpointArn,
            ':userTopicSubscriptionArn': userTopicSubscriptionArn,
            ':expiresAt':
                Math.round(Date.now() / 1000) + THIRTY_DAYS_IN_SECONDS,
        },
    };
    try {
        await ddbDocClient.update(params).promise();
    } catch (e) {
        console.error(`Failed to adding endpoints to ${email}`, e);
        throw new Error('Error adding endpoints.');
    }
};

export const extendDeviceExpiration = async (
    email: string,
    deviceToken: string,
): Promise<Device> => {
    console.log(`Extending expiration for device of ${email}`);
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['DEVICE_TABLE_NAME'] as string,
        Key: {
            email: email,
            deviceToken: deviceToken,
        },
        UpdateExpression: 'SET expiresAt = :expiresAt',
        ExpressionAttributeValues: {
            ':expiresAt':
                Math.round(Date.now() / 1000) + THIRTY_DAYS_IN_SECONDS,
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as Device;
    } catch (e) {
        console.error(`Failed to extend expiration for device of ${email}`, e);
        throw new Error('Error extending expiration.');
    }
};

export const doesDeviceExist = async (email: string, deviceToken: string) => {
    console.log(`Checking if ${deviceToken} is a device for ${email}`);
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['DEVICE_TABLE_NAME'] as string,
        Key: {
            email: email,
            deviceToken: deviceToken,
        },
    };
    try {
        const result = await ddbDocClient.get(params).promise();
        if (result.Item) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        console.error(`Failed to check device ${deviceToken} for ${email}`, e);
        throw new Error('Error checking device for user.');
    }
};

export const getDeviceByPlatformEndpointArn = async (
    platformEndpointArn: string,
): Promise<Device | undefined> => {
    console.log(`Getting device by platform endpoint ${platformEndpointArn}`);
    const ddbDocClient = getDynamoClient({ skipCache: true });
    const params = {
        TableName: process.env['DEVICE_TABLE_NAME'] as string,
        IndexName: 'platformEndpointArnToDeviceIndex',
        KeyConditionExpression: 'platformEndpointArn = :platformEndpointArn',
        ExpressionAttributeValues: {
            ':platformEndpointArn': platformEndpointArn,
        },
    };
    try {
        const result = await ddbDocClient.query(params).promise();
        if (result.Items && result.Items.length > 0) {
            return result.Items[0] as Device;
        } else {
            return undefined;
        }
    } catch (e) {
        console.error(
            `Failed to get device by platform endpoint ${platformEndpointArn}`,
            e,
        );
        throw new Error('Error getting device by platform endpoint.');
    }
};

export const listDevices = async (email: string): Promise<Device[]> => {
    console.log(`Listing devices for ${email}`);
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['DEVICE_TABLE_NAME'] as string,
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': email,
        },
    };
    try {
        const result = await ddbDocClient.query(params).promise();
        if (result.Items) {
            return result.Items as Device[];
        } else {
            return [];
        }
    } catch (e) {
        console.error(`Failed to list devices for ${email}`, e);
        throw new Error('Error listing devices.');
    }
};

export const unregisterDevice = async (
    email: string,
    deviceToken: string,
): Promise<void> => {
    console.log(`Unregistering ${deviceToken} for ${email}`);
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['DEVICE_TABLE_NAME'] as string,
        Key: {
            email: email,
            deviceToken: deviceToken,
        },
    };
    try {
        await ddbDocClient.delete(params).promise();
    } catch (e) {
        console.error(`Failed to unregister ${deviceToken} for ${email}`, e);
        throw new Error('Error unregistering device.');
    }
};
