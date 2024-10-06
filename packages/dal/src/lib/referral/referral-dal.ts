import { getDynamoClient } from '../../aws';
import { Referral } from './referral-model';

export const createReferral = async (
    referringEmail: string,
    referredEmail: string,
): Promise<Referral> => {
    console.log(`Making ${referringEmail} a referrer for ${referredEmail}`);
    const ddbDocClient = getDynamoClient();
    const now = new Date().toISOString();
    const params = {
        TableName: process.env['REFERRAL_TABLE_NAME'] as string,
        Item: {
            referringEmail: referringEmail,
            referredEmail: referredEmail,
            referredAt: now,
        },
    };
    try {
        await ddbDocClient.put(params).promise();
        return {
            referringEmail: referringEmail,
            referredEmail: referredEmail,
            referredAt: now,
        } as Referral;
    } catch (e) {
        console.error(
            `Failed to create ${referringEmail} a referrer for ${referredEmail}`,
            e,
        );
        throw new Error('Error creating referral.');
    }
};

export const getReferrals = async (
    referringEmail: string,
): Promise<Referral[]> => {
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['REFERRAL_TABLE_NAME'] as string,
        KeyConditionExpression: 'referringEmail = :referringEmail',
        ExpressionAttributeValues: {
            ':referringEmail': referringEmail,
        },
    };
    try {
        const result = await ddbDocClient.query(params).promise();
        if (result.Items) {
            return result.Items as Referral[];
        } else {
            return [];
        }
    } catch (e) {
        console.error(`Failed to get referrals for ${referringEmail}`, e);
        throw new Error('Error getting referrals.');
    }
};
