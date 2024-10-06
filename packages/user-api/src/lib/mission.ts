import { Request, Response } from 'lambda-api';
import {
    getMission as getMissionFromDal,
    Mission,
    Task,
    TaskType,
    TaskLength,
    addMission,
    listDataEntries,
    DataEntry,
    addHeartsForUser,
    getUser,
    isGuardianForUser,
    InAppRewardType,
    User,
} from '@eddii-backend/dal';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';
import {
    isValidDate,
    validEmail,
    validTaskType,
    validateAndNormalizeEmail,
} from '@eddii-backend/utils';

const getAmountForDailyTask = (taskType: TaskType) => {
    if (taskType === TaskType.noSugaryDrink) {
        return 0;
    } else if (taskType === TaskType.exerciseEntry) {
        // Random number 20, 40, or 60
        return Math.floor(Math.random() * 3) * 20 + 20;
    } else {
        // Random number from 2 to 4
        return Math.floor(Math.random() * 3) + 2;
    }
};

const getProgressForFoodSpecific = (
    foodName: string,
    task: Task,
    dataEntries: DataEntry[],
) => {
    // Loops through dataEntries and adds up the amount of foodName by checking the foods array
    let total = 0;
    for (const dataEntry of dataEntries) {
        if (dataEntry.foods?.length > 0) {
            for (const foodEntry of dataEntry.foods) {
                if (foodEntry.foodName === foodName) {
                    total += 1;
                }
            }
        }
    }
    return Math.min(total, task.amount) / task.amount;
};

const getProgressForMedicineEntry = (task: Task, dataEntries: DataEntry[]) => {
    // Loops through dataEntries and adds up the medicine entries
    let total = 0;
    for (const dataEntry of dataEntries) {
        if (dataEntry.medicines?.length > 0) {
            total += dataEntry.medicines.length;
        }
    }
    return Math.min(total, task.amount) / task.amount;
};

const getProgressForExerciseEntry = (task: Task, dataEntries: DataEntry[]) => {
    // Loop through dataEntries and adds up the exercise entries minutes
    let total = 0;
    for (const dataEntry of dataEntries) {
        if (dataEntry.exercises?.length > 0) {
            for (const exerciseEntry of dataEntry.exercises) {
                total += exerciseEntry.exerciseTime;
            }
        }
    }
    return Math.min(total, task.amount) / task.amount;
};

const getProgressForFeelingEntry = (task: Task, dataEntries: DataEntry[]) => {
    // Loop through dataEntries and adds up the feeling entries
    let total = 0;
    for (const dataEntry of dataEntries) {
        if (dataEntry.feelings?.length > 0) {
            total += dataEntry.feelings.length;
        }
    }
    return Math.min(total, task.amount) / task.amount;
};

const getProgressForFoodEntry = (task: Task, dataEntries: DataEntry[]) => {
    // Loop through dataEntries and adds up the food entries
    let total = 0;
    for (const dataEntry of dataEntries) {
        if (dataEntry.foods?.length > 0) {
            total += dataEntry.foods.length;
        }
    }
    return Math.min(total, task.amount) / task.amount;
};

const getProgressForDataEntry = (task: Task, dataEntries: DataEntry[]) => {
    // Loop through dataEntries and adds up the data entries
    let total = 0;
    for (const dataEntry of dataEntries) {
        if (dataEntry.foods?.length > 0) {
            total += dataEntry.foods.length;
        }
        if (dataEntry.medicines?.length > 0) {
            total += dataEntry.medicines.length;
        }
        if (dataEntry.exercises?.length > 0) {
            total += dataEntry.exercises.length;
        }
        if (dataEntry.feelings?.length > 0) {
            total += dataEntry.feelings.length;
        }
    }
    return Math.min(total, task.amount) / task.amount;
};

const getProgressForNoSugaryDrink = (task: Task, dataEntries: DataEntry[]) => {
    // Loops through dataEntries and check if any sugary drinks
    let total = 0;
    for (const dataEntry of dataEntries) {
        if (dataEntry.foods?.length > 0) {
            for (const foodEntry of dataEntry.foods) {
                if (foodEntry.foodName === 'sugary_drinks') {
                    total += 1;
                }
            }
        }
    }
    if (total === 0) {
        return 1;
    } else {
        return 0;
    }
};

const getProgressForTask = (task: Task, dataEntries: DataEntry[]) => {
    if (task.taskType === TaskType.drinkWater) {
        return getProgressForFoodSpecific('water', task, dataEntries);
    } else if (task.taskType === TaskType.medicineEntry) {
        return getProgressForMedicineEntry(task, dataEntries);
    } else if (task.taskType === TaskType.exerciseEntry) {
        return getProgressForExerciseEntry(task, dataEntries);
    } else if (task.taskType === TaskType.feelingEntry) {
        return getProgressForFeelingEntry(task, dataEntries);
    } else if (task.taskType === TaskType.foodEntry) {
        return getProgressForFoodEntry(task, dataEntries);
    } else if (task.taskType === TaskType.dataEntry) {
        return getProgressForDataEntry(task, dataEntries);
    } else if (task.taskType === TaskType.noSugaryDrink) {
        return getProgressForNoSugaryDrink(task, dataEntries);
    } else if (task.taskType === TaskType.eatVeggies) {
        return getProgressForFoodSpecific('vegetables', task, dataEntries);
    } else {
        throw new Error('Invalid task type');
    }
};

const getRandomDailyTasks = (total = 4) => {
    // Generate ${total} random tasks without duplicates
    const tasks: Task[] = [];
    const taskTypes = [
        TaskType.drinkWater,
        TaskType.medicineEntry,
        TaskType.exerciseEntry,
        TaskType.feelingEntry,
        TaskType.foodEntry,
        TaskType.dataEntry,
    ];
    for (let i = 0; i < total; i++) {
        const index = Math.floor(Math.random() * taskTypes.length);
        // Delete index from taskTypes
        tasks.push({
            taskType: taskTypes[index],
            taskLength: TaskLength.day,
            amount: getAmountForDailyTask(taskTypes[index]),
            reward: InAppRewardType.twoHearts,
        });
        taskTypes.splice(index, 1);
    }
    return tasks;
};

export const getDataEntriesForTheDay = async (
    email: string,
): Promise<DataEntry[]> => {
    let page = undefined;
    let dataEntries = [];
    do {
        const [data, pageToken] = await listDataEntries(
            email,
            // Start of today
            new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
            // End of today
            new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
            page,
        );
        dataEntries = [...dataEntries, ...data];
        page = pageToken;
    } while (page !== undefined);
    return dataEntries;
};

const getDataEntriesForTheWeek = async (
    email: string,
): Promise<DataEntry[]> => {
    let page = undefined;
    let dataEntries = [];
    const startOfWeek = new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay()),
    );
    const endOfWeek = new Date(
        new Date().setDate(new Date().getDate() + (7 - new Date().getDay())),
    );
    do {
        const [data, pageToken] = await listDataEntries(
            email,
            // Start of current week
            new Date(startOfWeek.setHours(0, 0, 0, 0)).toISOString(),
            // End of current week
            new Date(endOfWeek.setHours(23, 59, 59, 999)).toISOString(),
            page,
        );
        dataEntries = [...dataEntries, ...data];
        page = pageToken;
    } while (page !== undefined);
    return dataEntries;
};

const claimReward = async (
    user: User,
    email: string,
    reward: string,
): Promise<User | undefined> => {
    const inAppReward = InAppRewardType[reward];
    if (inAppReward === undefined) {
        // Out of app reward.
        return undefined;
    }
    if (inAppReward === InAppRewardType.twoHearts) {
        return await addHeartsForUser(
            email,
            2,
            user.dailyHeartsLimit,
            user.dailyHeartsLimitDate,
            true,
        );
    } else if (inAppReward === InAppRewardType.tenHearts) {
        return await addHeartsForUser(
            email,
            10,
            user.dailyHeartsLimit,
            user.dailyHeartsLimitDate,
            true,
        );
    }
    return undefined;
};

export const generateDailyMission = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const todayMissionAt = new Date().toISOString().split('T')[0];
    const todayMission = await getMissionFromDal(email, todayMissionAt);
    let mission: Mission = {
        email: email,
        missionAt: todayMissionAt,
        tasks: [],
    };
    if (todayMission) {
        if (
            todayMission.tasks?.length > 0 &&
            todayMission.tasks?.find(task => task.taskLength === TaskLength.day)
        ) {
            response
                .status(404)
                .json({ message: 'Daily missions already generated.' });
            return;
        }
        mission = todayMission;
    }
    mission.tasks = [...mission.tasks, ...getRandomDailyTasks()];
    const missionToReturn = await addMission(mission);
    response.status(200).json(missionToReturn);
};

export const getDailyMissionStatus = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const todayMissionAt = new Date().toISOString().split('T')[0];
    const todayMission = await getMissionFromDal(email, todayMissionAt);
    if (
        !todayMission ||
        !todayMission.tasks?.find(task => task.taskLength === TaskLength.day)
    ) {
        response.status(404).json({ message: 'Daily missions not found.' });
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const missionToReturn: any = {
        ...todayMission,
        tasks: todayMission.tasks.filter(
            task => task.taskLength === TaskLength.day,
        ),
    };
    const dataEntries = await getDataEntriesForTheDay(email);
    for (const task of missionToReturn.tasks) {
        task.progress = getProgressForTask(task, dataEntries);
    }
    // Check completion status of all tasks
    response.status(200).json(missionToReturn);
};

export const getMission = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const missionAt = request.query.missionAt;
    if (!missionAt) {
        response.status(400).json({ message: 'MissionAt is required.' });
        return;
    }
    if (!isValidDate(missionAt)) {
        response
            .status(400)
            .json({ message: 'Invalid MissionAt time format.' });
        return;
    }

    const mission = await getMissionFromDal(email, missionAt);
    if (!mission) {
        response.status(404).json({ message: 'Mission not found.' });
        return;
    }
    response.status(200).json(mission);
};

export const completeTaskForDailyMission = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const taskType = request.params.taskType;
    if (!taskType || !validTaskType(taskType)) {
        response.status(400).json({ message: 'Valid TaskType is required.' });
        return;
    }
    const todayMissionAt = new Date().toISOString().split('T')[0];
    const todayMission = await getMissionFromDal(email, todayMissionAt);
    if (
        !todayMission ||
        !todayMission.tasks?.find(
            task =>
                task.taskLength === TaskLength.day &&
                task.taskType === taskType,
        )
    ) {
        response.status(404).json({ message: 'Daily mission task not found.' });
        return;
    }
    const task = todayMission.tasks?.find(
        task =>
            task.taskLength === TaskLength.day && task.taskType === taskType,
    );
    if (task.completed === true) {
        response.status(400).json({ message: 'Task already completed.' });
        return;
    }
    const dataEntries = await getDataEntriesForTheDay(email);
    const progress = getProgressForTask(task, dataEntries);
    if (progress < 1) {
        response.status(400).json({ message: 'Task not completed.' });
        return;
    }
    task.completed = true;
    const missionToReturn = await addMission(todayMission);
    const user = await getUser(email);
    const fetchedUser = await claimReward(user, email, task.reward);
    response.status(200).json({ mission: missionToReturn, user: fetchedUser });
};

export const requestWeeklyMission = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const guardianUser = validateAndNormalizeEmail(request.body.guardianEmail);
    if (!guardianUser) {
        response
            .status(400)
            .json({ message: 'Valid Guardian email is required.' });
        return;
    }
    const isGuardian = await isGuardianForUser(guardianUser, email);
    if (!isGuardian) {
        response.status(401).json({ message: 'User is not a guardian.' });
        return;
    }
    const guardianUserAccount = await getUser(guardianUser);
    if (!guardianUserAccount) {
        response.status(404).json({ message: 'Guardian user not found.' });
        return;
    }
    const user = await getUser(email);

    // Get ISOString of the start of the week
    const startOfWeek = new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay()),
    )
        .toISOString()
        .split('T')[0];
    const startOfWeekMission = await getMissionFromDal(email, startOfWeek);
    if (
        startOfWeekMission &&
        startOfWeekMission.tasks.find(
            task => task.taskLength === TaskLength.week,
        )
    ) {
        response.status(404).json({ message: 'Weekly mission already setup.' });
        return;
    }
    // Send message to guardian
    await publishPushNotificationToUserTopicArn(
        guardianUserAccount.userTopicArn,
        'Challenge Requested',
        `You have been requested to set a weekly challenge by ${
            user.nickname ? user.nickname : 'your friend'
        }`,
        'weekly-challenge',
    );

    response.status(200).json({ message: 'Weekly mission requested.' });
};

export const getWeeklyMissionStatus = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    // Get ISOString of the start of the week
    const startOfWeek = new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay()),
    )
        .toISOString()
        .split('T')[0];
    const startOfWeekMission = await getMissionFromDal(email, startOfWeek);
    if (
        !startOfWeekMission ||
        !startOfWeekMission.tasks?.find(
            task => task.taskLength === TaskLength.week,
        )
    ) {
        response.status(404).json({ message: 'Weekly mission not found.' });
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const missionToReturn: any = {
        ...startOfWeekMission,
        tasks: startOfWeekMission.tasks.filter(
            task => task.taskLength === TaskLength.week,
        ),
    };
    const dataEntries = await getDataEntriesForTheWeek(email);
    for (const task of missionToReturn.tasks) {
        task.progress = getProgressForTask(task, dataEntries);
    }
    // Check completion status of all tasks
    response.status(200).json(missionToReturn);
};

export const completeTaskForWeeklyMission = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const from = request.params.from;
    if (!from || !validEmail(from)) {
        response.status(400).json({ message: 'Valid From Email is required.' });
        return;
    }
    // Get ISOString of the start of the week
    const startOfWeek = new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay()),
    )
        .toISOString()
        .split('T')[0];
    const startOfWeekMission = await getMissionFromDal(email, startOfWeek);
    if (
        !startOfWeekMission ||
        !startOfWeekMission.tasks?.find(
            task => task.taskLength === TaskLength.week && task.from === from,
        )
    ) {
        response.status(404).json({ message: 'Weekly mission not found.' });
        return;
    }
    const task = startOfWeekMission.tasks?.find(
        task => task.taskLength === TaskLength.week,
    );
    if (task.completed === true) {
        response.status(400).json({ message: 'Task already completed.' });
        return;
    }
    const dataEntries = await getDataEntriesForTheWeek(email);
    const progress = getProgressForTask(task, dataEntries);
    if (progress < 1) {
        response.status(400).json({ message: 'Task not completed.' });
        return;
    }
    task.completed = true;
    const missionToReturn = await addMission(startOfWeekMission);
    const user = await getUser(email);
    const fetchedUser = await claimReward(user, email, task.reward);
    response.status(200).json({ mission: missionToReturn, user: fetchedUser });
};
