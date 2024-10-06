import { HEARTS_PER_DAY_LIMIT, User } from './user-model';
import { getDynamoClient, sanitizeItem } from '../../aws';
import { StoreItem } from '../store/store-model';

export const createUser = async (userModel: User): Promise<User> => {
    console.log(`Creating new user: ${JSON.stringify(userModel)}`);

    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['USER_TABLE_NAME'] as string,
        Item: sanitizeItem(userModel),
    };

    try {
        await ddbDocClient.put(params).promise();
        return userModel;
    } catch (e) {
        console.error(
            `Failed to create user with parameters: ${JSON.stringify(
                userModel,
            )}`,
            e,
        );
        throw new Error('Error creating user.');
    }
};

export const addHeartsForUser = async (
    email: string,
    heartsToAdd: number,
    dailyHeartsLimit: number,
    dailyHeartsLimitDate: string,
    skipDailyLimitCheck = false,
): Promise<User | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    console.log(`Adding ${heartsToAdd} to email: ${email}`);
    let resetLimit = false;
    const today = new Date().toISOString().split('T')[0];
    if (dailyHeartsLimitDate !== new Date().toISOString().split('T')[0]) {
        resetLimit = true;
    } else if (!skipDailyLimitCheck && heartsToAdd > dailyHeartsLimit) {
        return undefined;
    }

    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['USER_TABLE_NAME'] as string,
        Key: {
            email: email,
        },
        UpdateExpression: `SET hearts = hearts + :heartsToAdd, lifetimeHearts = lifetimeHearts + :heartsToAdd, updatedAt = :updatedAt, ${
            resetLimit
                ? 'dailyHeartsLimitDate = :dailyHeartsLimitDate, dailyHeartsLimit = :heartsPerDayLimit - :heartsToAdd'
                : 'dailyHeartsLimit = dailyHeartsLimit - :heartsToAdd'
        }`,
        ConditionExpression: `:heartsToAdd > :zero ${
            resetLimit || skipDailyLimitCheck
                ? ''
                : 'AND :heartsToAdd <= dailyHeartsLimit'
        }`,
        ExpressionAttributeValues: {
            ':heartsToAdd': heartsToAdd,
            ':updatedAt': new Date().toISOString(),
            ':zero': 0,
            ...(resetLimit && {
                ':dailyHeartsLimitDate': today,
                ':heartsPerDayLimit': HEARTS_PER_DAY_LIMIT,
            }),
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as User;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.code === 'ConditionalCheckFailedException') {
            return undefined;
        } else {
            console.error(`Failed to add hearts to email: ${email}`, error);
            throw new Error('Error adding hearts.');
        }
    }
};

export const spendHearts = async (
    email: string,
    heartsToRemove: number,
): Promise<User | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    console.log(`Removing ${heartsToRemove} to email: ${email}`);

    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['USER_TABLE_NAME'] as string,
        Key: {
            email: email,
        },
        UpdateExpression:
            'SET hearts = hearts - :heartsToRemove, updatedAt = :updatedAt',
        ConditionExpression:
            ':heartsToRemove > :zero AND hearts >= :heartsToRemove',
        ExpressionAttributeValues: {
            ':heartsToRemove': heartsToRemove,
            ':updatedAt': new Date().toISOString(),
            ':zero': 0,
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as User;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.code === 'ConditionalCheckFailedException') {
            return undefined;
        } else {
            console.error(`Failed to remove hearts to email: ${email}`, error);
            throw new Error('Error removing hearts.');
        }
    }
};

export const equipStoreItemForUser = async (
    email: string,
    item: StoreItem,
): Promise<User | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!item) {
        throw new Error('Item is required.');
    }
    console.log(`Equipping item ${JSON.stringify(item)} for email: ${email}`);

    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['USER_TABLE_NAME'] as string,
        Key: {
            email: email,
        },
        UpdateExpression:
            'SET eddiiEquippedItems.#slot = :itemName, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#slot': item.slot,
        },
        ExpressionAttributeValues: {
            ':itemName': item.name,
            ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as User;
    } catch (e) {
        console.error(
            `Failed to equip item ${JSON.stringify(item)} for email: ${email}`,
            e,
        );
        throw new Error('Error equipping item.');
    }
};

export const resetStoreItemsForUser = async (
    email: string,
): Promise<User | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    console.log(`Resetting eddii for email: ${email}`);

    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['USER_TABLE_NAME'] as string,
        Key: {
            email: email,
        },
        UpdateExpression:
            'SET eddiiEquippedItems = :item, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
            ':item': {},
            ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as User;
    } catch (e) {
        console.error(`Failed to reset eddii for email: ${email}`, e);
        throw new Error('Error resetting eddii.');
    }
};

export const getUser = async (email: string): Promise<User> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    console.log(`Getting user with email: ${email}`);

    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['USER_TABLE_NAME'] as string,
        Key: {
            email: email,
        },
    };
    try {
        return (await ddbDocClient.get(params).promise()).Item as User;
    } catch (e) {
        console.error(`Failed to get user with email: ${email}`, e);
        throw new Error('Error getting user.');
    }
};

export const updateUserProfile = async ({
    email,
    nickname,
    locale,
    zoneinfo,
    ageRange,
    birthday,
    diabetesInfo,
    phoneNumber,
    avatar,
    badges,
}: {
    email: string;
    nickname?: string;
    locale?: string;
    zoneinfo?: string;
    ageRange?: string;
    birthday?: string;
    diabetesInfo?: string;
    phoneNumber?: string;
    avatar?: string;
    badges?: string[];
}): Promise<User | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    console.log(`Updating user profile with email: ${email}`);

    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['USER_TABLE_NAME'] as string,
        Key: {
            email: email,
        },
        UpdateExpression: `SET ${nickname ? 'nickname = :nickname,' : ''} ${
            locale ? 'locale = :locale,' : ''
        } ${zoneinfo ? 'zoneinfo = :zoneinfo,' : ''} ${
            ageRange ? 'ageRange = :ageRange,' : ''
        } ${diabetesInfo ? 'diabetesInfo = :diabetesInfo,' : ''} ${
            phoneNumber ? 'phoneNumber = :phoneNumber,' : ''
        } ${avatar ? 'avatar = :avatar,' : ''} ${
            badges ? 'badges = :badges,' : ''
        } ${birthday ? 'birthday = :birthday,' : ''} updatedAt = :updatedAt`,
        ExpressionAttributeValues: {
            ...(nickname && {
                ':nickname': nickname,
            }),
            ...(locale && {
                ':locale': locale,
            }),
            ...(zoneinfo && {
                ':zoneinfo': zoneinfo,
            }),
            ...(ageRange && {
                ':ageRange': ageRange,
            }),
            ...(diabetesInfo && {
                ':diabetesInfo': diabetesInfo,
            }),
            ...(phoneNumber && {
                ':phoneNumber': phoneNumber,
            }),
            ...(avatar && {
                ':avatar': avatar,
            }),
            ...(badges && {
                ':badges': badges,
            }),
            ...(birthday && {
                ':birthday': birthday,
            }),
            ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as User;
    } catch (e) {
        console.error(`Failed to update user profile with email: ${email}`, e);
        throw new Error('Error updating user profile.');
    }
};

export const updateUserNotificationSettings = async (
    email: string,
    glucoseAlerts?: boolean,
    dailyAlerts?: boolean,
): Promise<User | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    console.log(`Updating user notification settings with email: ${email}`);

    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['USER_TABLE_NAME'] as string,
        Key: {
            email: email,
        },
        UpdateExpression: `SET ${
            glucoseAlerts !== undefined ? 'glucoseAlerts = :glucoseAlerts,' : ''
        } ${
            dailyAlerts !== undefined ? 'dailyAlerts = :dailyAlerts,' : ''
        } updatedAt = :updatedAt`,
        ExpressionAttributeValues: {
            ...(glucoseAlerts !== undefined && {
                ':glucoseAlerts': Boolean(glucoseAlerts),
            }),
            ...(dailyAlerts !== undefined && {
                ':dailyAlerts': Boolean(dailyAlerts),
            }),
            ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as User;
    } catch (e) {
        console.error(
            `Failed to update user notification settings with email: ${email}`,
            e,
        );
        throw new Error('Error updating user notification settings.');
    }
};

export const updateUserAlertSettings = async (
    email: string,
    lowGlucoseAlertThreshold?: number,
    highGlucoseAlertThreshold?: number,
): Promise<User | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    const ddbDocClient = getDynamoClient();
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues: any = {
        ':updatedAt': new Date().toISOString(),
    };
    let removeExpressions = [];

    if (lowGlucoseAlertThreshold !== undefined) {
        updateExpression +=
            ', lowGlucoseAlertThreshold = :lowGlucoseAlertThreshold';
        expressionAttributeValues[':lowGlucoseAlertThreshold'] =
            lowGlucoseAlertThreshold;
    } else {
        removeExpressions.push('lowGlucoseAlertThreshold');
    }

    if (highGlucoseAlertThreshold !== undefined) {
        updateExpression +=
            ', highGlucoseAlertThreshold = :highGlucoseAlertThreshold';
        expressionAttributeValues[':highGlucoseAlertThreshold'] =
            highGlucoseAlertThreshold;
    } else {
        removeExpressions.push('highGlucoseAlertThreshold');
    }

    if (removeExpressions.length > 0) {
        updateExpression += ' REMOVE ' + removeExpressions.join(', ');
    }

    const params = {
        TableName: process.env['USER_TABLE_NAME'] as string,
        Key: {
            email: email,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as User;
    } catch (e) {
        console.error(
            `Failed to update user alert settings with email: ${email}`,
            e,
        );
        throw new Error('Error updating user alert settings.');
    }
};

export const batchGetUserProfiles = async (
    emails: string[],
): Promise<
    {
        email: string;
        nickname?: string;
        ageRange?: string;
        avatar?: string;
        badges?: string[];
    }[]
> => {
    if (!emails || emails.length === 0) {
        throw new Error('Emails are required.');
    }

    const ddbDocClient = getDynamoClient();

    const batchSize = 100;
    const batches = Math.ceil(emails.length / batchSize);
    let users: {
        email: string;
        nickname?: string;
        ageRange?: string;
        avatar?: string;
        badges?: string[];
    }[] = [];

    for (let i = 0; i < batches; i++) {
        const batchEmails = emails.slice(i * batchSize, (i + 1) * batchSize);
        console.log(`Getting users profiles for ${batchEmails.length} emails.`);
        const params = {
            RequestItems: {
                [process.env['USER_TABLE_NAME'] as string]: {
                    Keys: batchEmails.map(email => ({ email })),
                    ProjectionExpression:
                        'email, nickname, ageRange, avatar, badges',
                },
            },
        };
        try {
            const response = await ddbDocClient.batchGet(params).promise();
            if (response.Responses) {
                users = users.concat(
                    response.Responses[
                        process.env['USER_TABLE_NAME'] as string
                    ] as {
                        email: string;
                        nickname?: string;
                        ageRange?: string;
                        avatar?: string;
                        badges?: string[];
                    }[],
                );
            }
        } catch (e) {
            console.error(`Failed to batch get user profiles with emails`, e);
            throw new Error('Error batch getting user profiles.');
        }
    }

    return users;
};
