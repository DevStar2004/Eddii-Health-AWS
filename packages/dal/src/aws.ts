import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import Clients from '@eddii-backend/clients';

// Update in validation as well!
const GAME_IDS = [
    'streak',
    'eddiiBurst',
    'sugarSaga',
    'snake',
    'flappyEddii',
    'wordle',
    'rps',
    'eddiiNinja',
    'brawlHero',
    'wheresThePhone',
    'kongClimb',
    'duneBuggyRacing',
    'milkBottlingChallenge',
    'skyHigh',
    'chickenBlast',
    'hoopStar',
    'superJump',
    'skiHero',
];

const batchArrayGroup = (docArray: any[] = []) => {
    const arrays = [];
    const size = 20;
    while (docArray.length > 0) arrays.push(docArray.splice(0, size));
    return arrays;
};

export const sanitizeItem = (item: any): any => {
    if (typeof item !== 'object' || item === null || item === undefined) {
        return item;
    } else if (Array.isArray(item)) {
        return item.map(sanitizeItem);
    } else {
        const map: Record<string, any> = {};
        for (const key in item) {
            const value = item[key];
            if (typeof value !== 'function' && value !== undefined) {
                map[key] = sanitizeItem(value);
            }
        }
        return map;
    }
};

export const getDynamoClient = (
    { skipCache } = { skipCache: false },
): DynamoDB.DocumentClient => {
    if (skipCache || !Clients.dax) {
        return Clients.dynamo;
    } else {
        return Clients.dax;
    }
};

export const deleteAllItemsForTable = async (
    tableName: string,
    hashKey: string,
    hashValue: string,
    rangeKey?: string,
    rangeValue?: string,
    indexName?: string,
): Promise<void> => {
    console.log(`Deleting all items for table: ${tableName}...`);
    const ddbDocClient = getDynamoClient();
    const keys: any[] = [];
    try {
        let lastEvaluatedKey = undefined;
        do {
            const params = {
                TableName: tableName,
                IndexName: indexName,
                KeyConditionExpression:
                    `#${hashKey} = :${hashKey}` +
                    (rangeKey && rangeValue
                        ? ` AND #${rangeKey} = :${rangeKey}`
                        : ''),
                ExpressionAttributeNames: {
                    [`#${hashKey}`]: hashKey,
                    ...(rangeKey ? { [`#${rangeKey}`]: rangeKey } : {}),
                },
                ExpressionAttributeValues: {
                    [`:${hashKey}`]: hashValue,
                    ...(rangeKey && rangeValue
                        ? { [`:${rangeKey}`]: rangeValue }
                        : {}),
                },
                ProjectionExpression: rangeKey
                    ? `#${hashKey}, #${rangeKey}`
                    : `#${hashKey}`,
                ExclusiveStartKey: lastEvaluatedKey,
            };
            const data: DynamoDB.QueryOutput = await ddbDocClient
                .query(params)
                .promise();

            if (data.Items) {
                keys.push(
                    ...data.Items.map(item => ({
                        DeleteRequest: {
                            Key: {
                                [hashKey]: item[hashKey],
                                ...(rangeKey && { [rangeKey]: item[rangeKey] }),
                            },
                        },
                    })),
                );
            }
            lastEvaluatedKey = data.LastEvaluatedKey;
        } while (lastEvaluatedKey);
    } catch (error) {
        console.error(
            `Error fetching all ${tableName} items for deleting:`,
            error,
        );
        throw error;
    }

    try {
        const batchArr = batchArrayGroup(keys);
        for await (const batch of batchArr) {
            await ddbDocClient
                .batchWrite({
                    RequestItems: {
                        [tableName]: batch,
                    },
                })
                .promise();
        }
    } catch (error) {
        console.error(`Error deleting all ${tableName} items:`, error);
        throw error;
    }
};

export const deleteUserData = async (email: string): Promise<void> => {
    await deleteAllItemsForTable(
        process.env['CHAT_TABLE_NAME'] as string,
        'email',
        email,
        'entryAt',
    );
    await deleteAllItemsForTable(
        process.env['DATA_ENTRY_TABLE_NAME'] as string,
        'email',
        email,
        'entryAt',
    );
    await deleteAllItemsForTable(
        process.env['DEVICE_TABLE_NAME'] as string,
        'email',
        email,
        'deviceToken',
    );
    // Sleep for 30 seconds to allow for the device to be removed from the device table
    await new Promise(resolve => setTimeout(resolve, 30000));
    await deleteAllItemsForTable(
        process.env['GUARDIAN_TABLE_NAME'] as string,
        'userEmail',
        email,
        'guardianEmail',
        undefined,
        'userToGuardianIndex',
    );
    await deleteAllItemsForTable(
        process.env['GUARDIAN_TABLE_NAME'] as string,
        'guardianEmail',
        email,
        'userEmail',
    );
    for await (const gameId of GAME_IDS) {
        await deleteAllItemsForTable(
            process.env['LEADERBOARD_TABLE_NAME'] as string,
            'gameId',
            gameId,
            'email',
            email,
        );
    }
    await deleteAllItemsForTable(
        process.env['MISSION_TABLE_NAME'] as string,
        'email',
        email,
        'missionAt',
    );
    await deleteAllItemsForTable(
        process.env['PATIENT_TABLE_NAME'] as string,
        'email',
        email,
    );
    await deleteAllItemsForTable(
        process.env['QUIZ_TABLE_NAME'] as string,
        'email',
        email,
        'quizId',
    );
    await deleteAllItemsForTable(
        process.env['USER_SESSION_TABLE_NAME'] as string,
        'email',
        email,
        'type',
    );
    await deleteAllItemsForTable(
        process.env['STORE_TABLE_NAME'] as string,
        'email',
        email,
        'itemId',
    );
    await deleteAllItemsForTable(
        process.env['STREAK_TABLE_NAME'] as string,
        'email',
        email,
        'visitedAt',
    );
    await deleteAllItemsForTable(
        process.env['SUBSCRIPTION_TABLE_NAME'] as string,
        'email',
        email,
    );
    await deleteAllItemsForTable(
        process.env['USER_TABLE_NAME'] as string,
        'email',
        email,
    );
};
