export enum TaskType {
    // eslint-disable-next-line no-unused-vars
    drinkWater = 'drinkWater',
    // eslint-disable-next-line no-unused-vars
    medicineEntry = 'medicineEntry',
    // eslint-disable-next-line no-unused-vars
    exerciseEntry = 'exerciseEntry',
    // eslint-disable-next-line no-unused-vars
    feelingEntry = 'feelingEntry',
    // eslint-disable-next-line no-unused-vars
    foodEntry = 'foodEntry',
    // eslint-disable-next-line no-unused-vars
    dataEntry = 'dataEntry',
    // eslint-disable-next-line no-unused-vars
    noSugaryDrink = 'noSugaryDrink',
    // eslint-disable-next-line no-unused-vars
    eatVeggies = 'eatVeggies',
}

export enum InAppRewardType {
    // eslint-disable-next-line no-unused-vars
    twoHearts = 'twoHearts',
    // eslint-disable-next-line no-unused-vars
    tenHearts = 'tenHearts',
}

export enum TaskLength {
    // eslint-disable-next-line no-unused-vars
    day = 'day',
    // eslint-disable-next-line no-unused-vars
    week = 'week',
}

export interface Task {
    taskType: TaskType;
    amount: number;
    taskLength: TaskLength;
    from?: string;
    completed?: boolean;
    reward?: string;
}

export interface Mission {
    email: string;
    missionAt: string;
    tasks: Task[];
}
