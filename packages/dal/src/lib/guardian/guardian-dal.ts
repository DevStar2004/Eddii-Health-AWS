import { getDynamoClient } from '../../aws';
import { Guardian, GuardianRole, GuardianStatus } from './guardian-model';

export const createGuardian = async (
    guardianEmail: string,
    userEmail: string,
    status: GuardianStatus,
    role: GuardianRole,
): Promise<Guardian> => {
    console.log(`Making ${guardianEmail} a guardian for ${userEmail}`);
    const ddbDocClient = getDynamoClient();
    const now = new Date().toISOString();
    const params = {
        TableName: process.env['GUARDIAN_TABLE_NAME'] as string,
        Item: {
            guardianEmail: guardianEmail,
            userEmail: userEmail,
            createdAt: now,
            updatedAt: now,
            status: status,
            role: role,
        },
    };
    try {
        await ddbDocClient.put(params).promise();
        return {
            guardianEmail: guardianEmail,
            userEmail: userEmail,
        } as Guardian;
    } catch (e) {
        console.error(
            `Failed to create ${guardianEmail} a guardian for ${userEmail}`,
            e,
        );
        throw new Error('Error creating guardian.');
    }
};

export const updateGuardianStatus = async (
    guardianEmail: string,
    userEmail: string,
    status: GuardianStatus,
): Promise<Guardian | undefined> => {
    if (!guardianEmail || !userEmail) {
        throw new Error('Guardian email and user email are required.');
    }
    console.log(
        `Updating status for guardian ${guardianEmail} for user ${userEmail}`,
    );
    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['GUARDIAN_TABLE_NAME'] as string,
        Key: {
            guardianEmail: guardianEmail,
            userEmail: userEmail,
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
    };

    try {
        const result = await ddbDocClient.update(params).promise();
        return result.Attributes as Guardian;
    } catch (e) {
        console.error(
            `Failed to update status for guardian ${guardianEmail} for user ${userEmail}`,
            e,
        );
        throw new Error('Error updating guardian status.');
    }
};

export const updateGuardianNotificationSettings = async (
    guardianEmail: string,
    userEmail: string,
    lowGlucoseAlertThreshold?: number,
    highGlucoseAlertThreshold?: number,
): Promise<Guardian | undefined> => {
    if (!guardianEmail || !userEmail) {
        throw new Error('Email is required.');
    }
    console.log(
        `Updating guardian settings for ${guardianEmail} -> ${userEmail}`,
    );
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
        TableName: process.env['GUARDIAN_TABLE_NAME'] as string,
        Key: {
            guardianEmail: guardianEmail,
            userEmail: userEmail,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as Guardian;
    } catch (e) {
        console.error(
            `Failed to update guardian settings for ${guardianEmail} -> ${userEmail}`,
            e,
        );
        throw new Error('Error updating update guardian settings.');
    }
};

export const listUsersForGuardian = async (
    guardianEmail: string,
): Promise<Guardian[]> => {
    console.log(`Listing users for ${guardianEmail}`);
    const ddbDocClient = getDynamoClient({ skipCache: true });
    const params = {
        TableName: process.env['GUARDIAN_TABLE_NAME'] as string,
        KeyConditionExpression: 'guardianEmail = :guardianEmail',
        ExpressionAttributeValues: {
            ':guardianEmail': guardianEmail,
        },
    };
    try {
        const result = await ddbDocClient.query(params).promise();
        if (result.Items) {
            return result.Items as Guardian[];
        } else {
            return [];
        }
    } catch (e) {
        console.error(`Failed to list users for ${guardianEmail}`, e);
        throw new Error('Error listing users accounts.');
    }
};

export const listGuardiansForUser = async (
    userEmail: string,
): Promise<Guardian[]> => {
    console.log(`Listing guardians for ${userEmail}`);
    const ddbDocClient = getDynamoClient({ skipCache: true });
    // Setup params for querying GSI
    const params = {
        TableName: process.env['GUARDIAN_TABLE_NAME'] as string,
        IndexName: 'userToGuardianIndex',
        KeyConditionExpression: 'userEmail = :userEmail',
        ExpressionAttributeValues: {
            ':userEmail': userEmail,
        },
    };

    try {
        const result = await ddbDocClient.query(params).promise();
        if (result.Items) {
            return result.Items as Guardian[];
        } else {
            return [];
        }
    } catch (e) {
        console.error(`Failed to list guardians for ${userEmail}`, e);
        throw new Error('Error listing guardians accounts.');
    }
};

export const getGuardianForUser = async (
    guardianEmail: string,
    userEmail: string,
): Promise<Guardian | undefined> => {
    console.log(`Getting ${guardianEmail} guardian for ${userEmail}`);
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['GUARDIAN_TABLE_NAME'] as string,
        Key: {
            guardianEmail: guardianEmail,
            userEmail: userEmail,
        },
    };
    try {
        const result = await ddbDocClient.get(params).promise();
        if (result.Item) {
            return result.Item as Guardian;
        } else {
            return undefined;
        }
    } catch (e) {
        console.error(
            `Failed to get guardian ${guardianEmail} for user ${userEmail}`,
            e,
        );
        throw new Error('Error getting guardian for user.');
    }
};

export const isGuardianForUser = async (
    guardianEmail: string,
    userEmail: string,
): Promise<boolean> => {
    console.log(`Checking if ${guardianEmail} is a guardian for ${userEmail}`);
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['GUARDIAN_TABLE_NAME'] as string,
        Key: {
            guardianEmail: guardianEmail,
            userEmail: userEmail,
        },
    };
    try {
        const result = await ddbDocClient.get(params).promise();
        if (result.Item) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        console.error(
            `Failed to check guarding ${guardianEmail} for user ${userEmail}`,
            e,
        );
        throw new Error('Error checking guardian for user.');
    }
};

export const deleteGuardian = async (
    guardianEmail: string,
    userEmail: string,
): Promise<void> => {
    console.log(`Deleting ${guardianEmail} guardian for ${userEmail}`);
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['GUARDIAN_TABLE_NAME'] as string,
        Key: {
            guardianEmail: guardianEmail,
            userEmail: userEmail,
        },
    };
    try {
        await ddbDocClient.delete(params).promise();
    } catch (e) {
        console.error(
            `Failed to delete ${guardianEmail} a guardian for ${userEmail}`,
            e,
        );
        throw new Error('Error deleting guardian.');
    }
};
