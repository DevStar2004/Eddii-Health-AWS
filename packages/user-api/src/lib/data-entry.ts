import { Request, Response } from 'lambda-api';
import {
    DataEntry,
    ExerciseEntry,
    FeelingEntry,
    FoodEntry,
    MedicineEntry,
    upsertDataEntry,
    listDataEntries as listDataEntriesFromDal,
    addHeartsForUser as addHeartsForUserFromDal,
    getUser,
} from '@eddii-backend/dal';
import {
    isISOString,
    validExercise,
    validFeeling,
    validFood,
    validMedicine,
} from '@eddii-backend/utils';

export const putDataEntry = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const dataEntryType = request.params.dataEntryType;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    let entryAt = request.body.entryAt;
    if (!entryAt) {
        entryAt = new Date().toISOString();
    } else if (!isISOString(entryAt)) {
        response.status(400).json({ message: 'Invalid entryAt time format.' });
        return;
    }
    if (!dataEntryType) {
        response.status(400).json({ message: 'Data entry type is required.' });
        return;
    }
    const dataEntries = [];
    if (dataEntryType === 'foods') {
        request.body.foods.forEach(food => {
            if (!validFood(food)) {
                response.status(400).json({ message: 'Invalid food.' });
                return;
            }
            dataEntries.push(
                new FoodEntry(food.foodName, food.macros, food.description),
            );
        });
    } else if (dataEntryType === 'feelings') {
        request.body.feelings.forEach(feeling => {
            if (!validFeeling(feeling)) {
                response.status(400).json({ message: 'Invalid feeling.' });
                return;
            }
            dataEntries.push(
                new FeelingEntry(feeling.feeling, feeling.description),
            );
        });
    } else if (dataEntryType === 'medicines') {
        request.body.medicines.forEach(medicine => {
            if (!validMedicine(medicine)) {
                response.status(400).json({ message: 'Invalid medicine.' });
                return;
            }
            dataEntries.push(
                new MedicineEntry(
                    medicine.medicineType,
                    medicine.medicineName,
                    medicine.amount,
                ),
            );
        });
    } else if (dataEntryType === 'exercises') {
        request.body.exercises.forEach(exercise => {
            if (!validExercise(exercise)) {
                response.status(400).json({ message: 'Invalid exercise.' });
                return;
            }
            dataEntries.push(
                new ExerciseEntry(exercise.exerciseTime, exercise.exerciseName),
            );
        });
    } else {
        response.status(400).json({ message: 'Invalid data entry type.' });
        return;
    }
    const dataEntry = await upsertDataEntry(email, entryAt, dataEntries);
    const user = await getUser(email);
    const fetchedUser = await addHeartsForUserFromDal(
        email,
        1,
        user.dailyHeartsLimit,
        user.dailyHeartsLimitDate,
    );
    response.status(200).json({ dataEntry: dataEntry, user: fetchedUser });
};

export const listDataEntries = async (
    request: Request,
    response: Response,
): Promise<{ dataEntries: DataEntry[]; page: string | undefined }> => {
    const email = request.userEmail;
    if (!request.query.startTimestamp) {
        response.status(400).json({ message: 'StartTimestamp is required.' });
        return;
    }
    if (!request.query.endTimestamp) {
        response.status(400).json({ message: 'EndTimestamp is required.' });
        return;
    }
    if (!isISOString(request.query.startTimestamp)) {
        response
            .status(400)
            .json({ message: 'Invalid StartTimestamp time format.' });
        return;
    }
    if (!isISOString(request.query.endTimestamp)) {
        response
            .status(400)
            .json({ message: 'Invalid EndTimestamp time format.' });
        return;
    }

    const { startTimestamp, endTimestamp, page } = request.query;
    const { filters } = request.multiValueQuery;

    const [dataEntries, pageToken] = await listDataEntriesFromDal(
        email,
        startTimestamp,
        endTimestamp,
        page,
        filters,
    );
    return { dataEntries, page: pageToken };
};
