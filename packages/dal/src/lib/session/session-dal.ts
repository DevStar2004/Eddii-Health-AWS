import { getDynamoClient, sanitizeItem } from '../../aws';
import { Session, SessionType } from './session-model';

export const putSession = async (session: Session): Promise<Session> => {
    const client = getDynamoClient();
    const params = {
        TableName: process.env['USER_SESSION_TABLE_NAME'] as string,
        Item: sanitizeItem(session),
    };
    try {
        await client.put(params).promise();
        return session;
    } catch (e) {
        console.error(`Failed to putting session`, e);
        throw new Error('Error putting session.');
    }
};

export const getSession = async (
    email: string,
    type: SessionType,
): Promise<Session> => {
    const client = getDynamoClient();
    const params = {
        TableName: process.env['USER_SESSION_TABLE_NAME'] as string,
        Key: {
            email: email,
            type: type,
        },
    };
    try {
        const result = await client.get(params).promise();
        return result.Item as Session;
    } catch (e) {
        console.error(
            `Failed to get session with email:type: ${email}:${type}`,
            e,
        );
        throw new Error('Error getting session.');
    }
};

export const doesSessionExist = async (email: string): Promise<boolean> => {
    const client = getDynamoClient({ skipCache: true });
    const params = {
        TableName: process.env['USER_SESSION_TABLE_NAME'] as string,
        KeyConditionExpression: '#email = :email',
        ExpressionAttributeNames: {
            '#email': 'email',
        },
        ExpressionAttributeValues: {
            ':email': email,
        },
        Select: 'COUNT',
        Limit: 1,
    };
    try {
        const result = await client.query(params).promise();
        if (result.Count !== undefined) {
            return (result.Count as number) > 0;
        } else {
            return false;
        }
    } catch (e) {
        console.error(
            `Failed to check if session exists for email: ${email}`,
            e,
        );
        throw new Error('Error checking if session exists.');
    }
};

export const deleteSession = async (
    email: string,
    type: SessionType,
): Promise<void> => {
    const client = getDynamoClient();
    const params = {
        TableName: process.env['USER_SESSION_TABLE_NAME'] as string,
        Key: {
            email: email,
            type: type,
        },
    };
    try {
        await client.delete(params).promise();
    } catch (e) {
        console.error(
            `Failed to delete session with email:type: ${email}:${type}`,
            e,
        );
        throw new Error('Error deleting session.');
    }
};

export const getSessionCountByUserId = async (
    userId: string,
): Promise<number> => {
    const client = getDynamoClient({ skipCache: true });
    const params = {
        TableName: process.env['USER_SESSION_TABLE_NAME'] as string,
        IndexName: 'userIdToEmailIndex',
        KeyConditionExpression: '#userId = :userId',
        ExpressionAttributeNames: {
            '#userId': 'userId',
        },
        ExpressionAttributeValues: {
            ':userId': userId,
        },
        Select: 'COUNT',
    };
    try {
        const result = await client.query(params).promise();
        return result.Count as number;
    } catch (e) {
        console.error(`Failed to get sessions with userId: ${userId}`, e);
        throw new Error('Error getting sessions.');
    }
};

export const listSessionsByUserId = async (
    userId: string,
): Promise<Session[]> => {
    const client = getDynamoClient();
    const params = {
        TableName: process.env['USER_SESSION_TABLE_NAME'] as string,
        IndexName: 'userIdToEmailIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId,
        },
    };
    try {
        const result = await client.query(params).promise();
        if (!result?.Items) {
            return [];
        }
        return result.Items as Session[];
    } catch (e) {
        console.error(`Failed to list sessions for userId: ${userId}`, e);
        throw new Error('Error listing sessions.');
    }
};

export const scanSessionsToRefresh = async (
    now: number,
    lastEvaluatedKey?: string,
): Promise<{ sessions: Session[]; lastEvaluatedKey?: string }> => {
    const client = getDynamoClient();
    const exclusiveStartKey = lastEvaluatedKey
        ? JSON.parse(Buffer.from(lastEvaluatedKey, 'base64').toString('utf8'))
        : undefined;
    const params = {
        TableName: process.env['USER_SESSION_TABLE_NAME'] as string,
        ExclusiveStartKey: exclusiveStartKey,
        FilterExpression: '#expiresAt <= :now',
        ExpressionAttributeNames: {
            '#expiresAt': 'expiresAt',
        },
        ExpressionAttributeValues: {
            ':now': now,
        },
    };
    try {
        const result = await client.scan(params).promise();
        return {
            sessions: result.Items as Session[],
            lastEvaluatedKey: result.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString(
                      'base64',
                  )
                : undefined,
        };
    } catch (e) {
        console.error('Failed to scan sessions', e);
        throw new Error('Error scanning sessions.');
    }
};
