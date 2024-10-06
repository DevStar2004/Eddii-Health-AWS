import { getDynamoClient, sanitizeItem } from '../../aws';
import { Subscription } from './subscription-model';

export const createSubscription = async (
    subscription: Subscription,
): Promise<Subscription> => {
    if (!subscription || !subscription.email) {
        throw new Error('Subscription is required.');
    }
    const client = getDynamoClient();
    const params = {
        TableName: process.env['SUBSCRIPTION_TABLE_NAME'] as string,
        Item: sanitizeItem(subscription),
    };
    try {
        await client.put(params).promise();
        return subscription;
    } catch (e) {
        console.error(`Failed to add subscription`, e);
        throw new Error('Error adding subscription.');
    }
};

export const getSubscription = async (
    email: string,
): Promise<Subscription | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    console.log(`Getting subscription by email ${email}`);
    const client = getDynamoClient();
    const params = {
        TableName: process.env['SUBSCRIPTION_TABLE_NAME'] as string,
        Key: {
            email: email,
        },
    };
    try {
        const result = await client.get(params).promise();
        if (result.Item) {
            return result.Item as Subscription;
        } else {
            return undefined;
        }
    } catch (e) {
        console.error(`Failed to get subscription`, e);
        throw new Error('Error getting subscription.');
    }
};

export const getSubscriptionByTxId = async (
    txId: string,
): Promise<Subscription | undefined> => {
    console.log(`Getting subscription by original tx ${txId}`);
    const client = getDynamoClient({ skipCache: true });
    const params = {
        TableName: process.env['SUBSCRIPTION_TABLE_NAME'] as string,
        IndexName: 'txIdToEmailIndex',
        KeyConditionExpression: 'txId = :txId',
        ExpressionAttributeValues: {
            ':txId': txId,
        },
    };
    try {
        const result = await client.query(params).promise();
        if (result.Items && result.Items.length > 0) {
            return result.Items[0] as Subscription;
        } else {
            return undefined;
        }
    } catch (e) {
        console.error(`Failed to get subscription by tx ${txId}`, e);
        throw new Error('Failed to get subscription by tx.');
    }
};
