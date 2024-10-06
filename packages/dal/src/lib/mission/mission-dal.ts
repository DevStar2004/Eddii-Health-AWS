import { getDynamoClient, sanitizeItem } from '../../aws';
import { Mission, Task } from './mission-model';

export const addMission = async (mission: Mission): Promise<Mission> => {
    if (!mission || !mission.email || !mission.missionAt) {
        throw new Error('Mission is required.');
    }
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['MISSION_TABLE_NAME'] as string,
        Item: sanitizeItem(mission),
    };
    try {
        await ddbDocClient.put(params).promise();
        return mission;
    } catch (e) {
        console.error(`Failed to add mission`, e);
        throw new Error('Error adding mission.');
    }
};

export const addTaskToMission = async (
    email: string,
    missionAt: string,
    task: Task,
): Promise<Mission> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!missionAt) {
        throw new Error('MissionAt is required.');
    }
    if (!task || !task.taskType || !task.amount || !task.taskLength) {
        throw new Error('Task is required.');
    }

    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['MISSION_TABLE_NAME'] as string,
        Key: {
            email: email,
            missionAt: missionAt,
        },
        UpdateExpression:
            'SET #tasks = list_append(if_not_exists(#tasks, :empty_list), :task)',
        ExpressionAttributeNames: {
            '#tasks': 'tasks',
        },
        ExpressionAttributeValues: {
            ':task': [sanitizeItem(task)],
            ':empty_list': [],
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as Mission;
    } catch (e) {
        console.error(`Failed to add task to mission`, e);
        throw new Error('Error adding task to mission.');
    }
};

export const getMission = async (
    email: string,
    missionAt: string,
): Promise<Mission | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!missionAt) {
        throw new Error('MissionAt is required.');
    }
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['MISSION_TABLE_NAME'] as string,
        Key: {
            email: email,
            missionAt: missionAt,
        },
    };
    try {
        const result = await ddbDocClient.get(params).promise();
        return result.Item ? (result.Item as Mission) : undefined;
    } catch (e) {
        console.error(`Failed to get mission`, e);
        throw new Error('Error getting mission.');
    }
};
