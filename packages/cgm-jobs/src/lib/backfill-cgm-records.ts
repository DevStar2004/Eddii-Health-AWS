import {
    DexcomEgv,
    OAuthSession,
    batchSaveDexcomEgvs,
    getSession,
    getUser,
} from '@eddii-backend/dal';
import { getRealtimeEgvsDataFromDexcom } from '@eddii-backend/dexcom';
import { EgvsRecords } from '@eddii-backend/types';
import { isDexcomDateString } from '@eddii-backend/utils';
import { SQSEvent } from 'aws-lambda';

const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day
const maxDuration = 30 * oneDay; // 30 days in milliseconds

const fetchDexcomEgvs = async (
    session: OAuthSession,
    startTimestamp: string,
    endTimestamp: string,
): Promise<EgvsRecords> => {
    const egvs = await getRealtimeEgvsDataFromDexcom(
        startTimestamp,
        endTimestamp,
        session,
    );
    return egvs;
};

export const handler = async (event: SQSEvent) => {
    for (const record of event.Records) {
        const { email, type } = JSON.parse(record.body);
        let { startTimestamp, endTimestamp } = JSON.parse(record.body);
        if (type !== 'dexcom') {
            continue;
        }
        if (!email) {
            console.error('Invalid email');
            continue;
        }
        const user = await getUser(email);
        if (!startTimestamp) {
            startTimestamp = new Date(
                new Date(user.createdAt).getTime() - 6 * 30 * oneDay,
            )
                .toISOString()
                .split('.')[0];
        }
        if (!endTimestamp) {
            endTimestamp = new Date().toISOString().split('.')[0];
        }
        console.log(
            `Backfilling ${type} egvs for ${email}, ${startTimestamp} - ${endTimestamp}`,
        );
        if (
            !isDexcomDateString(startTimestamp) ||
            !isDexcomDateString(endTimestamp)
        ) {
            console.error(`Invalid date format for ${email}`);
            continue;
        }
        const startDate = new Date(startTimestamp + 'Z');
        const endDate = new Date(endTimestamp + 'Z');
        if (startDate >= endDate) {
            console.error(`Invalid date range for ${email}`);
            continue;
        }
        const session = await getSession(email, type);
        const dexcomSession = session as OAuthSession;
        const now = new Date();
        if (!dexcomSession) {
            console.error(`Cannot find session for ${email}`);
            continue;
        }
        if (dexcomSession.expiresAt < now.getTime() / 1000) {
            console.error(`Session for ${email} has expired`);
            continue;
        }
        if (!dexcomSession.userId) {
            console.error(`Invalid session for ${email}`);
            continue;
        }
        const egvs: DexcomEgv[] = [];

        try {
            while (startDate < endDate) {
                console.log(
                    `Fetching egvs for ${email} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
                );
                const tempEndDate = new Date(startDate.getTime() + maxDuration);
                const chunkEnd = tempEndDate > endDate ? endDate : tempEndDate;
                const chunkStartTimestamp = startDate
                    .toISOString()
                    .split('.')[0];
                const chunkEndTimestamp = chunkEnd.toISOString().split('.')[0];

                const chunkEgvs = await fetchDexcomEgvs(
                    dexcomSession,
                    chunkStartTimestamp,
                    chunkEndTimestamp,
                );
                egvs.push(
                    ...chunkEgvs.records.map(record => ({
                        ...record,
                        userId: dexcomSession.userId,
                    })),
                );

                startDate.setTime(chunkEnd.getTime() + 1); // move start date to one millisecond after last chunk end
            }
        } catch (e) {
            console.error(`Failed to fetch egvs for ${email}`, e);
            throw new Error('Error while fetching dexcom egvs.');
        }

        try {
            await batchSaveDexcomEgvs(egvs);
        } catch (e) {
            console.error(`Failed to save egvs for ${email}`, e);
            throw new Error('Error while saving dexcom egvs.');
        }
    }
};
