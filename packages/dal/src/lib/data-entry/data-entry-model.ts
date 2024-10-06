export abstract class Entry {}

export interface Macros {
    carbs?: number;
}

export class FoodEntry extends Entry {
    constructor(
        foodName: string,
        macros: Macros,
        description: string | undefined = undefined,
    ) {
        super();
        this.foodName = foodName;
        this.macros = macros;
        this.description = description;
    }

    foodName!: string;
    macros!: Macros;
    description?: string;
}

export enum Feeling {
    // eslint-disable-next-line no-unused-vars
    awful = 'awful',
    // eslint-disable-next-line no-unused-vars
    crying = 'crying',
    // eslint-disable-next-line no-unused-vars
    happy = 'happy',
    // eslint-disable-next-line no-unused-vars
    ok = 'ok',
    // eslint-disable-next-line no-unused-vars
    sad = 'sad',
    // eslint-disable-next-line no-unused-vars
    sick = 'sick',
    // eslint-disable-next-line no-unused-vars
    smile = 'smile',
    // eslint-disable-next-line no-unused-vars
    wonderful = 'wonderful',
}

export class FeelingEntry extends Entry {
    constructor(feeling: Feeling, description: string | undefined = undefined) {
        super();
        this.feeling = feeling;
        this.description = description;
    }

    feeling!: Feeling;
    description?: string;
}

export class MedicineEntry extends Entry {
    constructor(medicineType: string, medicineName: string, amount: number) {
        super();
        this.medicineType = medicineType;
        this.medicineName = medicineName;
        this.amount = amount;
    }

    medicineType!: string;
    medicineName!: string;
    amount!: number;
}

export class ExerciseEntry extends Entry {
    constructor(
        exerciseTime: number,
        exerciseName: string | undefined = undefined,
    ) {
        super();
        this.exerciseTime = exerciseTime;
        this.exerciseName = exerciseName;
    }

    exerciseTime!: number;
    exerciseName?: string;
}

export interface DataEntry {
    email: string;
    entryAt: string;
    foods?: FoodEntry[];
    feelings?: FeelingEntry[];
    medicines?: MedicineEntry[];
    exercises?: ExerciseEntry[];
}
