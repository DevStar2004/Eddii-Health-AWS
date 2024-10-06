import { Request, Response } from 'lambda-api';
import {
    DataEntry,
    ExerciseEntry,
    FoodEntry,
    OAuthSession,
    SessionType,
    getSession,
    listDataEntries,
    listDexcomEgvs,
} from '@eddii-backend/dal';
import {
    getDeviceDataFromDexcom,
    getRealtimeEgvsDataFromDexcom,
} from '@eddii-backend/dexcom';
import { DeviceRecords, EgvsRecord } from '@eddii-backend/types';

const closestGreaterOrEqualDate = (
    egvs: EgvsRecord[],
    target: string,
): number => {
    if (!egvs || egvs.length === 0) {
        return null;
    }
    let start = 0;
    let end = egvs.length - 1;

    while (start < end) {
        const mid = Math.floor((start + end) / 2); // bias towards the left

        if (egvs[mid].systemTime === target) {
            return mid;
        }

        if (egvs[mid].systemTime < target) {
            start = mid + 1;
        } else {
            end = mid;
        }
    }

    // When loop ends, start === end
    if (egvs[start].systemTime < target && start < egvs.length - 1) {
        return start + 1;
    }

    if (egvs[start].systemTime >= target) {
        return start;
    }

    // If no date is greater or equal
    return null;
};

const getEgvAfterAverage = (
    glucoseEntries: EgvsRecord[],
    dataEntries: DataEntry[],
    timeAfter = 2 * 60 * 60 * 1000,
) => {
    let averageEgvAfter2Hours = 0;
    let count = 0;
    if (
        !glucoseEntries ||
        !dataEntries ||
        glucoseEntries.length === 0 ||
        dataEntries.length === 0
    ) {
        return 0;
    }
    for (const dataEntry of dataEntries) {
        const twoHourAfter = closestGreaterOrEqualDate(
            glucoseEntries,
            new Date(
                new Date(dataEntry.entryAt).getTime() + timeAfter,
            ).toISOString(),
        );
        if (!twoHourAfter) {
            continue;
        }
        averageEgvAfter2Hours += glucoseEntries[twoHourAfter].value;
        count++;
    }
    if (count === 0) {
        return 0;
    }
    return averageEgvAfter2Hours / count;
};

const getTopFeelings = (
    feelingEntries: DataEntry[],
    max = 4,
): [string, number][] => {
    const feelingsCounter = new Map();
    for (const dataEntry of feelingEntries) {
        for (const feeling of dataEntry.feelings) {
            const count = feelingsCounter.get(feeling.feeling) || 0;
            feelingsCounter.set(feeling.feeling, count + 1);
        }
    }

    const feelingsCounterList = [...feelingsCounter.entries()];
    feelingsCounterList.sort((a, b) => b[1] - a[1]);
    return feelingsCounterList.slice(0, max);
};

const getWeeklyMetricsReport = async (
    email: string,
): Promise<{ [key: string]: any }> => {
    const session = await getSession(email, SessionType.dexcom);

    const now = new Date();
    now.setMinutes(0, 0, 0); // Set minutes and seconds to 0 to get the closest hour
    const endDate = new Date(now.getTime() + 60 * 60 * 1000)
        .toISOString()
        .split('.')[0]; // 1 hour from now
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('.')[0]; // 7 days ago

    const egvsRecords: EgvsRecord[] = [];
    let deviceResponse: DeviceRecords;
    if (session) {
        const dexcomSession = session as OAuthSession;
        const results = await listDexcomEgvs(
            dexcomSession.userId,
            startDate,
            endDate,
        );
        if (results?.length > 0 && results[0].length > 0) {
            egvsRecords.push(...results[0]);
        } else {
            const dexcomResults = await getRealtimeEgvsDataFromDexcom(
                startDate,
                endDate,
                dexcomSession,
            );
            if (dexcomResults?.records?.length > 0) {
                egvsRecords.push(...dexcomResults.records);
            }
        }
        deviceResponse = await getDeviceDataFromDexcom(dexcomSession);
    }

    let page = undefined;
    const foodEntries: DataEntry[] = [];
    const feelingEntries: DataEntry[] = [];
    const exerciseEntries: DataEntry[] = [];
    do {
        const [items, pageToken] = await listDataEntries(
            email,
            startDate,
            endDate,
            page,
            ['foods', 'feelings', 'exercises'],
        );
        foodEntries.push(
            ...items.filter(
                dataEntry => dataEntry.foods && dataEntry.foods.length > 0,
            ),
        );
        feelingEntries.push(
            ...items.filter(
                dataEntry =>
                    dataEntry.feelings && dataEntry.feelings.length > 0,
            ),
        );
        exerciseEntries.push(
            ...items.filter(
                dataEntry =>
                    dataEntry.exercises && dataEntry.exercises.length > 0,
            ),
        );
        page = pageToken;
    } while (page !== undefined);

    const topMoods = getTopFeelings(feelingEntries);
    const totalActivity = exerciseEntries
        .flatMap(exerciseEntry => exerciseEntry.exercises)
        .reduce((sum, entry: ExerciseEntry) => sum + entry.exerciseTime, 0);
    const totalCarbs = foodEntries
        .flatMap(foodEntry => foodEntry.foods)
        .reduce(
            (sum, entry: FoodEntry) =>
                sum + (entry.macros?.carbs ? entry.macros?.carbs : 0),
            0,
        );
    // Filter on first transmitterId
    // Eventually this will be selectable.
    const glucoseEntries = egvsRecords
        .filter(
            record =>
                record.transmitterId ===
                deviceResponse.records[0]?.transmitterId,
        )
        .sort((a, b) => a.systemTime.localeCompare(b.systemTime));
    const totalGlucoseEntries = glucoseEntries.length;
    const veryHigh = 250;
    const high = 180;
    const low = 70;
    const veryLow = 54;

    let veryHighCount = 0;
    let highCount = 0;
    let lowCount = 0;
    let veryLowCount = 0;
    let inRangeCount = 0;
    let averageEvg = 0;

    for (const egv of glucoseEntries) {
        if (!egv.value) {
            continue;
        }
        averageEvg += egv.value;
        if (egv.value > veryHigh) {
            veryHighCount++;
        } else if (egv.value > high) {
            highCount++;
        } else if (egv.value < veryLow) {
            veryLowCount++;
        } else if (egv.value < low) {
            lowCount++;
        } else {
            inRangeCount++;
        }
    }
    averageEvg /= totalGlucoseEntries;

    const avgEgvAfter2HoursActivity = getEgvAfterAverage(
        glucoseEntries,
        exerciseEntries,
    );
    const avgEgvAfter2HoursFood = getEgvAfterAverage(
        glucoseEntries,
        foodEntries,
    );

    return {
        glucoseMetrics: {
            inRangeCount: inRangeCount,
            veryHighCount: veryHighCount,
            highCount: highCount,
            lowCount: lowCount,
            veryLowCount: veryLowCount,
            entries: totalGlucoseEntries,
            averageEvg: averageEvg,
        },
        moodMetrics: {
            topMoods: topMoods.map(([feeling, count]) => {
                return {
                    mood: feeling,
                    frequency: count,
                    avgEgvAfter2HoursMood: getEgvAfterAverage(
                        glucoseEntries,
                        feelingEntries.filter(dataEntry =>
                            dataEntry.feelings.find(
                                feelingEntry =>
                                    feelingEntry.feeling === feeling,
                            ),
                        ),
                        0,
                    ),
                };
            }),
        },
        activityMetrics: {
            totalActivity: totalActivity,
            avgEgvAfter2HoursActivity: avgEgvAfter2HoursActivity,
        },
        foodMetrics: {
            totalCarbs: totalCarbs,
            avgEgvAfter2HoursFood: avgEgvAfter2HoursFood,
        },
    };
};

export const getWeeklyHealthSummary = async (
    request: Request,
    response: Response,
) => {
    const email = request.userEmail;
    const metrics = await getWeeklyMetricsReport(email);
    response.status(200).json(metrics);
};
