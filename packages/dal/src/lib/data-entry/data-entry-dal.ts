import { getDynamoClient, sanitizeItem } from '../../aws';
import {
    Entry,
    FoodEntry,
    FeelingEntry,
    MedicineEntry,
    ExerciseEntry,
    DataEntry,
} from './data-entry-model';

const PAGE_LIMIT = 1000;

const extractDataEntryType = (dataEntry: Entry): string => {
    if (dataEntry instanceof FoodEntry) {
        return 'foods';
    } else if (dataEntry instanceof FeelingEntry) {
        return 'feelings';
    } else if (dataEntry instanceof MedicineEntry) {
        return 'medicines';
    } else if (dataEntry instanceof ExerciseEntry) {
        return 'exercises';
    }
    throw new Error(`Unknown data entry type: ${dataEntry}`);
};

export const upsertDataEntry = async (
    email: string,
    entryAt: string,
    dataEntries: Entry[],
): Promise<DataEntry | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!dataEntries || dataEntries.length === 0) {
        throw new Error('No data entries provided.');
    }
    if (dataEntries.length > 100) {
        throw new Error('Too many data entries provided.');
    }
    const standardType = extractDataEntryType(dataEntries[0]);
    for (let i = 1; i < dataEntries.length; i++) {
        if (standardType != extractDataEntryType(dataEntries[i])) {
            throw new Error(
                'All data entries must be of the same type. Found: ' +
                    standardType +
                    ' and ' +
                    extractDataEntryType(dataEntries[i]),
            );
        }
    }
    console.log(
        `Upserting data entry ${JSON.stringify(
            dataEntries,
        )} for email: ${email} at ${entryAt}`,
    );
    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['DATA_ENTRY_TABLE_NAME'] as string,
        Key: {
            email: email,
            entryAt: entryAt,
        },
        UpdateExpression:
            'SET #dataEntryType = list_append(if_not_exists(#dataEntryType, :empty_list), :newValue)',
        ExpressionAttributeNames: {
            '#dataEntryType': standardType,
        },
        ExpressionAttributeValues: {
            ':newValue': dataEntries.map(entry => sanitizeItem(entry)),
            ':empty_list': [],
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as DataEntry;
    } catch (e) {
        console.error(
            `Failed to upsert data with parameters: ${JSON.stringify(
                dataEntries,
            )}`,
            e,
        );
        throw new Error('Error upserting data.');
    }
};

export const listDataEntries = async (
    email: string,
    startTimestamp: string,
    endTimestamp: string,
    page?: string,
    filters: string[] = [],
): Promise<[DataEntry[], string?]> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!startTimestamp) {
        throw new Error('Start timestamp is required.');
    }
    if (!endTimestamp) {
        throw new Error('End timestamp is required.');
    }
    const ddbDocClient = getDynamoClient({ skipCache: true });

    const lastEvaluatedKey = page
        ? JSON.parse(Buffer.from(page, 'base64').toString('utf8'))
        : undefined;
    const params = {
        TableName: process.env['DATA_ENTRY_TABLE_NAME'] as string,
        KeyConditionExpression:
            '#email = :email and #entryAt BETWEEN :start AND :end',
        ExpressionAttributeNames: {
            '#email': 'email',
            '#entryAt': 'entryAt',
        },
        ExpressionAttributeValues: {
            ':email': email,
            ':start': startTimestamp,
            ':end': endTimestamp,
        },
        ProjectionExpression:
            filters.length > 0
                ? ['email', 'entryAt', ...filters].join(',')
                : undefined,
        Limit: PAGE_LIMIT,
        ExclusiveStartKey: lastEvaluatedKey,
    };

    try {
        const result = await ddbDocClient.query(params).promise();
        return [
            result.Items ? (result.Items as DataEntry[]) : [],
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
