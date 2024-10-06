import { getDynamoClient } from '../../aws';
import { Streak } from './streak-model';

const PAGE_LIMIT = 1000;

export const addStreak = async (email: string): Promise<Streak> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    const ddbDocClient = getDynamoClient();
    const streak: Streak = {
        email: email,
        visitedAt: new Date().toISOString().split('T')[0],
    };
    const params = {
        TableName: process.env['STREAK_TABLE_NAME'] as string,
        Item: streak,
    };
    try {
        await ddbDocClient.put(params).promise();
        return streak;
    } catch (e) {
        console.error(`Failed to add streak`, e);
        throw new Error('Error adding streak.');
    }
};

export const getStreak = async (
    email: string,
    visitedAt: string,
): Promise<Streak> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!visitedAt) {
        throw new Error('VisitedAt is required.');
    }
    const ddbDocClient = getDynamoClient();
    const streak: Streak = {
        email: email,
        visitedAt: visitedAt,
    };
    const params = {
        TableName: process.env['STREAK_TABLE_NAME'] as string,
        Key: streak,
    };
    try {
        const result = await ddbDocClient.get(params).promise();
        return result.Item as Streak;
    } catch (e) {
        console.error(`Failed to get streak`, e);
        throw new Error('Error getting streak.');
    }
};

export const listStreaks = async (
    email: string,
    startDate: string,
    endDate: string,
    page?: string,
): Promise<[Streak[], string?]> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!startDate) {
        throw new Error('Start date is required.');
    }
    if (!endDate) {
        throw new Error('End date is required.');
    }
    const ddbDocClient = getDynamoClient({ skipCache: true });

    const lastEvaluatedKey = page
        ? JSON.parse(Buffer.from(page, 'base64').toString('utf8'))
        : undefined;
    const params = {
        TableName: process.env['STREAK_TABLE_NAME'] as string,
        KeyConditionExpression:
            '#email = :email and #visitedAt BETWEEN :start AND :end',
        ExpressionAttributeNames: {
            '#email': 'email',
            '#visitedAt': 'visitedAt',
        },
        ExpressionAttributeValues: {
            ':email': email,
            ':start': startDate,
            ':end': endDate,
        },
        Limit: PAGE_LIMIT,
        ExclusiveStartKey: lastEvaluatedKey,
    };

    try {
        const result = await ddbDocClient.query(params).promise();
        return [
            result.Items ? (result.Items as Streak[]) : [],
            result.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString(
                      'base64',
                  )
                : undefined,
        ];
    } catch (e) {
        console.error(`Failed to list data entries: ${e}`);
        throw e;
    }
};
