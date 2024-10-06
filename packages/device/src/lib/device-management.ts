import {
    CloudWatchLogsDecodedData,
    CloudWatchLogsEvent,
    DynamoDBStreamEvent,
} from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import {
    Device,
    addSnsEndpointsToDevice,
    createPlatformEndpoint,
    deletePlatformEndpoint,
    getDeviceByPlatformEndpointArn,
    getUser,
    subscribeEndpointToTopic,
    unregisterDevice,
    unsubscribeEndpointToTopic,
} from '@eddii-backend/dal';
import * as zlib from 'zlib';
import { promisify } from 'util';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';

const gunzipAsync = promisify(zlib.gunzip);

const handleDynamoDBEvent = async (
    event: DynamoDBStreamEvent,
): Promise<void> => {
    for (const record of event.Records) {
        // Ignore modifications
        if (record.eventName === 'MODIFY') {
            continue;
        }
        const device =
            record.eventName === 'REMOVE'
                ? (unmarshall(
                      record.dynamodb.OldImage as Record<
                          string,
                          AttributeValue
                      >,
                  ) as Device)
                : (unmarshall(
                      record.dynamodb.NewImage as Record<
                          string,
                          AttributeValue
                      >,
                  ) as Device);

        if (record.eventName === 'REMOVE') {
            // Unsubscribe the device from the topic
            await unsubscribeEndpointToTopic(device);
            // Delete the platform endpoint
            await deletePlatformEndpoint(device);
        } else {
            // Create a new platform endpoint for the device
            const platformEndpointArn = await createPlatformEndpoint(device);
            if (platformEndpointArn) {
                const user = await getUser(device.email);
                const subscriptionArn = await subscribeEndpointToTopic(
                    platformEndpointArn,
                    user.userTopicArn,
                );
                await addSnsEndpointsToDevice(
                    device.email,
                    device.deviceToken,
                    platformEndpointArn,
                    subscriptionArn,
                );
            }
        }
    }
};

const handleCloudWatchLogsEvent = async (
    event: CloudWatchLogsEvent,
): Promise<void> => {
    const decoded = Buffer.from(event.awslogs.data, 'base64');
    const result = await gunzipAsync(decoded);
    const json: CloudWatchLogsDecodedData = JSON.parse(
        result.toString('ascii'),
    );
    for (const logEvent of json.logEvents) {
        const json = JSON.parse(logEvent.message);
        if (
            json.status === 'FAILURE' &&
            (json.delivery?.providerResponse?.includes(
                'Endpoint is disabled',
            ) ||
                json.delivery?.providerResponse?.includes('NotRegistered') ||
                json.delivery?.providerResponse?.includes(
                    'InvalidRegistration',
                ))
        ) {
            const platformEndpointArn = json.delivery?.destination;
            const device = await getDeviceByPlatformEndpointArn(
                platformEndpointArn,
            );
            if (device) {
                // Unsubscribe the device from the topic
                await unsubscribeEndpointToTopic(device);
                // Delete the platform endpoint
                await deletePlatformEndpoint(device);
                // Deleve the device
                await unregisterDevice(device.email, device.deviceToken);
            }
        }
    }
};

export const handler = async (
    event: DynamoDBStreamEvent | CloudWatchLogsEvent,
) => {
    if ((event as DynamoDBStreamEvent).Records) {
        return handleDynamoDBEvent(event as DynamoDBStreamEvent);
    } else if ((event as CloudWatchLogsEvent).awslogs) {
        return handleCloudWatchLogsEvent(event as CloudWatchLogsEvent);
    }
};
