import { getDynamoClient } from '../../aws';
import { Chat } from './chat-model';

const CHATS_ITEMS_LIMIT = 50;

export const saveChatLog = async (chat: Chat): Promise<Chat> => {
    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['CHAT_TABLE_NAME'] as string,
        Item: chat,
    };
    try {
        await ddbDocClient.put(params).promise();
        return chat;
    } catch (e) {
        console.error(`Failed to save chat logs ${chat}`, e);
        throw new Error('Error while saving chat logs.');
    }
};

export const listChatsLogs = async (
    email: string,
    page?: string,
): Promise<[Chat[], string?]> => {
    const ddbDocClient = getDynamoClient({ skipCache: true });
    const lastEvaluatedKey = page
        ? JSON.parse(Buffer.from(page, 'base64').toString('utf8'))
        : undefined;
    const params = {
        TableName: process.env['CHAT_TABLE_NAME'] as string,
        KeyConditionExpression: '#email = :email',
        ExpressionAttributeNames: {
            '#email': 'email',
        },
        ExpressionAttributeValues: {
            ':email': email,
        },
        Limit: CHATS_ITEMS_LIMIT,
        ScanIndexForward: false,
        ExclusiveStartKey: lastEvaluatedKey,
    };

    try {
        const result = await ddbDocClient.query(params).promise();
        return [
            result.Items ? (result.Items as Chat[]) : [],
            result.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString(
                      'base64',
                  )
                : undefined,
        ];
    } catch (e) {
        console.error(`Failed to list chat logs for ${email}`, e);
        throw new Error('Error listing chat logs.');
    }
};

export const listLatestChatsLogs = async (email: string): Promise<Chat[]> => {
    const ddbDocClient = getDynamoClient({ skipCache: true });
    const now = new Date();

    const params = {
        TableName: process.env['CHAT_TABLE_NAME'] as string,
        KeyConditionExpression:
            '#email = :email and #entryAt BETWEEN :startDate and :endDate',
        ExpressionAttributeNames: {
            '#email': 'email',
            '#entryAt': 'entryAt',
        },
        ExpressionAttributeValues: {
            ':email': email,
            ':startDate': new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
            ':endDate': now.toISOString(),
        },
        Limit: 20,
        ScanIndexForward: false,
    };

    try {
        const result = await ddbDocClient.query(params).promise();
        console.log('Chats retrieved successfully:', result);
        if (result.Items && result.Items.length > 0) {
            return result.Items as Chat[];
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error getting chats:', error);
        throw error;
    }
};
