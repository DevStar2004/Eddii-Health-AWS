import {
    Task,
    TaskLength,
    TaskType,
    addMission,
    getMission,
    getUser,
    isGuardianForUser,
} from '@eddii-backend/dal';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';
import { validSmallString, validTaskType } from '@eddii-backend/utils';
import { Request, Response } from 'lambda-api';

export const getFriendlyTaskTypeName = (taskType: TaskType) => {
    switch (taskType) {
        case TaskType.drinkWater:
            return 'Drink Water';
        case TaskType.medicineEntry:
            return 'Medicine Entry';
        case TaskType.exerciseEntry:
            return 'Exercise Entry';
        case TaskType.feelingEntry:
            return 'Feeling Entry';
        case TaskType.foodEntry:
            return 'Food Entry';
        case TaskType.dataEntry:
            return 'Data Entry';
        case TaskType.noSugaryDrink:
            return 'No Sugary Drink';
        case TaskType.eatVeggies:
            return 'Eat Veggies';
        default:
            return 'Other';
    }
};

export const getAmountForWeeklyTask = (taskType: TaskType) => {
    if (taskType === TaskType.noSugaryDrink) {
        return 0;
    } else if (taskType === TaskType.exerciseEntry) {
        // Random number 60, 90, or 120
        return Math.floor(Math.random() * 3) * 30 + 60;
    } else {
        // Random number from 6 to 12
        return Math.floor(Math.random() * 7) + 6;
    }
};

export const setWeeklyMission = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const guardianEmail = request.guardianEmail;
    const userEmail = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { taskType, reward } = request.body;
    if (!taskType || !validTaskType(taskType)) {
        response.status(400).json({ message: 'Valid TaskType is required.' });
        return;
    }
    if (!reward || !validSmallString(reward)) {
        response.status(400).json({ message: 'Reward is required.' });
        return;
    }
    const taskTypeEnum = TaskType[taskType];

    const isGuardian = await isGuardianForUser(guardianEmail, userEmail);
    if (!isGuardian) {
        response
            .status(401)
            .json({ message: 'You are not a guardian for this user.' });
        return;
    }
    const guardian = await getUser(guardianEmail);
    const userAccount = await getUser(userEmail);
    if (!guardian) {
        response.status(404).json({ message: 'Guardian not found.' });
        return;
    }
    if (!userAccount) {
        response.status(404).json({ message: 'User not found.' });
        return;
    }

    // Get ISOString of the start of the week
    const startOfWeek = new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay()),
    )
        .toISOString()
        .split('T')[0];
    let startOfWeekMission = await getMission(userEmail, startOfWeek);
    if (
        startOfWeekMission &&
        startOfWeekMission.tasks.find(
            task => task.taskLength === TaskLength.week,
        )
    ) {
        response.status(404).json({ message: 'Weekly mission already setup.' });
        return;
    }
    if (!startOfWeekMission) {
        startOfWeekMission = {
            email: userEmail,
            missionAt: startOfWeek,
            tasks: [],
        };
    }

    const weeklyTask: Task = {
        taskType: taskTypeEnum,
        taskLength: TaskLength.week,
        reward: reward,
        amount: getAmountForWeeklyTask(taskTypeEnum),
        from: guardianEmail,
    };

    startOfWeekMission.tasks.push(weeklyTask);
    const missionToReturn = await addMission(startOfWeekMission);

    // Send message to user
    await publishPushNotificationToUserTopicArn(
        userAccount.userTopicArn,
        'Your Weekly Goal and Reward',
        `${
            guardian.nickname ? guardian.nickname : 'Your guardian'
        } has set your weekly goal to ${getFriendlyTaskTypeName(
            taskTypeEnum,
        )} and reward you ${reward}`,
        'weekly-challenge',
    );

    response.status(200).json(missionToReturn);
};
