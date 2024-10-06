import { getDynamoClient } from '../../aws';
import { DexcomEgv } from './dexcom-egv-model';

const PAGE_LIMIT = 1000;

export const saveDexcomEgv = async (
    dexcomEgv: DexcomEgv,
): Promise<DexcomEgv> => {
    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['DEXCOM_EGV_TABLE_NAME'] as string,
        Item: dexcomEgv,
    };
    try {
        await ddbDocClient.put(params).promise();
        return dexcomEgv;
    } catch (e) {
        console.error(`Failed to save dexcom egv ${dexcomEgv}`, e);
        throw new Error('Error while saving dexcom egv.');
    }
};

export const batchSaveDexcomEgvs = async (
    dexcomEgvs: DexcomEgv[],
): Promise<void> => {
    const ddbDocClient = getDynamoClient({ skipCache: true });
    const tableName = process.env['DEXCOM_EGV_TABLE_NAME'] as string;

    for (let i = 0; i < dexcomEgvs.length; i += 25) {
        const batch = dexcomEgvs.slice(i, i + 25);
        const putRequests = batch.map(egv => ({
            PutRequest: {
                Item: egv,
            },
        }));

        const params = {
            RequestItems: {
                [tableName]: putRequests,
            },
        };

        try {
            await ddbDocClient.batchWrite(params).promise();
        } catch (e) {
            console.error('Failed to batch save dexcom egvs', e);
            throw new Error('Error while batch saving dexcom egvs.');
        }
    }
};

export const listDexcomEgvs = async (
    userId: string,
    startTimestamp: string,
    endTimestamp: string,
    page?: string,
): Promise<[DexcomEgv[], string?]> => {
    if (!userId) {
        throw new Error('User ID is required.');
    }
    if (!startTimestamp) {
        throw new Error('Start timestamp is required.');
    }
    if (!endTimestamp) {
        throw new Error('End timestamp is required.');
    }
    const ddbDocClient = getDynamoClient();

    const lastEvaluatedKey = page
        ? JSON.parse(Buffer.from(page, 'base64').toString('utf8'))
        : undefined;
    const params = {
        TableName: process.env['DEXCOM_EGV_TABLE_NAME'] as string,
        KeyConditionExpression:
            '#userId = :userId and #systemTime BETWEEN :start AND :end',
        ExpressionAttributeNames: {
            '#userId': 'userId',
            '#systemTime': 'systemTime',
        },
        ExpressionAttributeValues: {
            ':userId': userId,
            ':start': startTimestamp,
            ':end': endTimestamp,
        },
        Limit: PAGE_LIMIT,
        ScanIndexForward: false,
        ExclusiveStartKey: lastEvaluatedKey,
    };

    try {
        const result = await ddbDocClient.query(params).promise();
        return [
            result.Items ? (result.Items as DexcomEgv[]) : [],
            result.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString(
                      'base64',
                  )
                : undefined,
        ];
    } catch (e) {
        console.error('Failed to list dexcom egvs', e);
        throw new Error('Error while listing dexcom egvs.');
    }
};
