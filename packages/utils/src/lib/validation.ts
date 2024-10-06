import validator from 'validator';
import moment from 'moment-timezone';
import { Feeling, ItemBundle, Slot, TaskType } from '@eddii-backend/dal';

// Update in aws.ts as well!
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

export const validEmail = (email?: string): boolean => {
    if (!email) {
        return false;
    }
    return validator.isEmail(email);
};

export const validateAndNormalizeEmail = (
    email?: string,
): string | undefined => {
    if (!email || !validEmail(email)) {
        return undefined;
    }
    const normalizeEmail = validator.normalizeEmail(email, {
        all_lowercase: true,
        gmail_lowercase: true,
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        gmail_convert_googlemaildotcom: false,
        outlookdotcom_lowercase: true,
        outlookdotcom_remove_subaddress: false,
        yahoo_lowercase: true,
        yahoo_remove_subaddress: false,
        icloud_lowercase: true,
        icloud_remove_subaddress: false,
    }) as string;
    return validator.trim(normalizeEmail);
};

export const validPhoneNumber = (phoneNumber?: string): boolean => {
    if (!phoneNumber) {
        return false;
    }
    return validator.isMobilePhone(phoneNumber, 'any', { strictMode: true });
};

export const validAlphaNumeric = (value?: string): boolean => {
    if (!value) {
        return false;
    }
    return validator.isAlphanumeric(value);
};

export const validNumericString = (value?: string): boolean => {
    if (!value) {
        return false;
    }
    return validator.isNumeric(value);
};

export const validNumber = (value?: string): boolean => {
    if (value === undefined) {
        return false;
    }
    if (typeof value === 'number') {
        return true;
    }
    return validator.isNumeric(value);
};

export const validArbitraryString = (value?: string): boolean => {
    if (!value) {
        return false;
    }
    const trimmed = validator.trim(value);
    return trimmed.length > 0 && trimmed.length <= 1024000;
};

export const validMediumString = (value?: string): boolean => {
    if (!value) {
        return false;
    }
    const trimmed = validator.trim(value);
    return trimmed.length > 0 && trimmed.length <= 1024;
};

export const validSmallString = (value?: string): boolean => {
    if (!value) {
        return false;
    }
    const trimmed = validator.trim(value);
    return trimmed.length > 0 && trimmed.length <= 128;
};

export const validLocale = (value?: string): boolean => {
    if (!value) {
        return false;
    }
    return value === 'en' || value === 'es';
};

export const isISOString = (val?: string) => {
    if (!val) {
        return false;
    }
    const d = new Date(val);
    return !Number.isNaN(d.valueOf()) && d.toISOString() === val;
};

export const isDexcomDateString = (val?: string) => {
    if (!val) {
        return false;
    }
    const d = new Date(val + 'Z');
    return !Number.isNaN(d.valueOf()) && d.toISOString().split('.')[0] === val;
};

export const isValidDate = (dateString?: string) => {
    if (!dateString) {
        return false;
    }
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) return false; // Invalid format
    const d = new Date(dateString);
    const dNum = d.getTime();
    if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
    return d.toISOString().slice(0, 10) === dateString;
};

export const isValidHealthieAppointmentDate = (dateString?: string) => {
    if (!dateString) {
        return false;
    }
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;
    const extendedIso8601Regex =
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{4}$/;
    if (
        iso8601Regex.test(dateString) ||
        extendedIso8601Regex.test(dateString)
    ) {
        const d = new Date(dateString);
        return !Number.isNaN(d.getTime());
    }
    return false;
};

export const validDevicePlatform = (platform?: string): boolean => {
    return platform === 'ios' || platform === 'android';
};

export const validTaskType = (taskType?: string): boolean => {
    if (!taskType) {
        return false;
    }
    const taskTypeEnum = TaskType[taskType as keyof typeof TaskType];
    return taskTypeEnum !== undefined;
};

export const validStoreItemBundleByValue = (itemBundle?: string): boolean => {
    if (!itemBundle) {
        return false;
    }
    // Vaidate if itemBundle is a valid enum value using the value and not the key
    return (Object.values(ItemBundle) as string[]).includes(itemBundle);
};

export const validStoreItemSlot = (slot?: string): boolean => {
    if (!slot) {
        return false;
    }
    const slotEnum = Slot[slot as keyof typeof Slot];
    return slotEnum !== undefined;
};

export const validFood = (food: any): boolean => {
    if (!food.foodName || !validSmallString(food.foodName)) {
        return false;
    }
    if (
        food.macros &&
        food.macros.carbs &&
        typeof food.macros.carbs !== 'number'
    ) {
        return false;
    }
    if (food.description && !validMediumString(food.description)) {
        return false;
    }
    return true;
};

export const validFeeling = (feeling: any): boolean => {
    if (!feeling.feeling || !validSmallString(feeling.feeling)) {
        return false;
    }
    const feelingEnum = Feeling[feeling.feeling as keyof typeof Feeling];
    if (feelingEnum === undefined) {
        return false;
    }
    if (feeling.description && !validMediumString(feeling.description)) {
        return false;
    }
    return true;
};

export const validMedicine = (medicine: any): boolean => {
    if (
        !medicine.medicineType ||
        !validSmallString(medicine.medicineType) ||
        !medicine.medicineName ||
        !validSmallString(medicine.medicineName)
    ) {
        return false;
    }
    if (!medicine.amount || typeof medicine.amount !== 'number') {
        return false;
    }
    return true;
};

export const validExercise = (exercise: any): boolean => {
    if (!exercise.exerciseTime || typeof exercise.exerciseTime !== 'number') {
        return false;
    }
    if (exercise.exerciseName && !validMediumString(exercise.exerciseName)) {
        return false;
    }
    return true;
};

export const validGameId = (gameId?: string): boolean => {
    if (!gameId) {
        return false;
    }
    return GAME_IDS.includes(gameId);
};

export const validQuizId = (quizId?: string): boolean => {
    if (!quizId) {
        return false;
    }
    return (
        quizId === 'quiz1' ||
        quizId === 'quiz2' ||
        quizId === 'quiz3' ||
        quizId === 'quiz4' ||
        quizId === 'quiz5' ||
        quizId === 'quiz6'
    );
};

export const validTimeZone = (value?: string): boolean => {
    if (!value) {
        return false;
    }
    return moment.tz.zone(value) !== null;
};

export const validFormSlug = (value?: string): boolean => {
    if (value === undefined) {
        return false;
    }
    return (
        value === 'care-center-setup' ||
        value === 'triage-hyper-flow' ||
        value === 'triage-hypo-flow' ||
        value === 'triage-wrong-dose-flow' ||
        value === 'triage-sick-day-flow' ||
        value === 'request-prescription' ||
        validNumericString(value)
    );
};

export const validInsuranceType = (value?: string): boolean => {
    if (value === undefined) {
        return false;
    }
    return (
        value === 'CHAMPVA' ||
        value === 'FECA Black Lung' ||
        value === 'Group Health Plan' ||
        value === 'Medicaid' ||
        value === 'Medicare' ||
        value === 'TRICARE CHAMPUS' ||
        value === 'Other'
    );
};

export const validHolderRelationship = (value?: string): boolean => {
    if (value === undefined) {
        return false;
    }
    return (
        value === 'Self' ||
        value === 'Child' ||
        value === 'Spouse' ||
        value === 'None' ||
        value === 'Other'
    );
};

export const validDataBase64String = (value?: string): boolean => {
    if (value === undefined) {
        return false;
    }
    const regex = /data:([-\w]+\/[-+\w.]+)?(;?\w+=[-\w]+)*(;base64)?,.*/;
    return regex.test(value);
};

export const validBase64String = (value?: string): boolean => {
    if (value === undefined) {
        return false;
    }
    return validator.isBase64(value);
};
