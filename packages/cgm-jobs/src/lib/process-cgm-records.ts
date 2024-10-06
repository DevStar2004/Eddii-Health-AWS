import {
    getDeviceDataFromDexcom,
    updateLatestEgvsDataFromDexcom,
} from '@eddii-backend/dexcom';
import { EgvsRecord } from '@eddii-backend/types';
import {
    Guardian,
    GuardianStatus,
    OAuthSession,
    Session,
    SessionType,
    User,
    getUser,
    listGuardiansForUser,
    listSessionsByUserId,
} from '@eddii-backend/dal';
import {
    publishPushNotificationToUserTopicArn,
    sendHighAlertVoiceMessage,
    sendLowAlertVoiceMessage,
} from '@eddii-backend/notifications';
import { getAlertName, getNotification } from './notifications';
import Clients from '@eddii-backend/clients';
import { KinesisStreamBatchResponse, KinesisStreamEvent } from 'aws-lambda';

const NOTIFICATION_ID = 'dexcom-egv-notification';
const TEN_MINUTES = 10 * 60 * 1000;

const shouldSendNotification = (
    lastAlertStatus?: string,
    alertStatus?: string,
) => {
    if (!alertStatus) {
        return false;
    }
    if (!lastAlertStatus) {
        return true;
    }
    return lastAlertStatus !== alertStatus;
};

const getDexcomAlert = async (
    user: User,
    guardianUsers: User[],
    egv: EgvsRecord,
    session: Session,
    lastAlertStatus?: string,
): Promise<string | undefined> => {
    let alertName = null;
    if (egv) {
        const deviceInfo = await getDeviceDataFromDexcom(
            session as OAuthSession,
        );
        if (deviceInfo) {
            let alertSettings = undefined;
            if (
                deviceInfo &&
                deviceInfo.records &&
                deviceInfo.records.length > 0
            ) {
                const firstRecord = deviceInfo.records[0];
                if (
                    firstRecord.alertSchedules &&
                    firstRecord.alertSchedules.length > 0
                ) {
                    alertSettings = firstRecord.alertSchedules[0].alertSettings;
                }
            }
            if (!alertSettings) {
                alertSettings = [
                    { alertName: 'urgentLow', enabled: true, value: 40 },
                    { alertName: 'low', enabled: true, value: 70 },
                    { alertName: 'high', enabled: true, value: 180 },
                ];
            }
            alertName = getAlertName(egv, alertSettings);
            if (shouldSendNotification(lastAlertStatus, alertName)) {
                console.log('Sending notification for alert:', alertName);
                const notification = getNotification(alertName, egv);
                if (notification) {
                    if (user.userTopicArn && user.glucoseAlerts) {
                        await publishPushNotificationToUserTopicArn(
                            user.userTopicArn,
                            notification.title,
                            notification.message,
                            NOTIFICATION_ID,
                        );
                    }
                    // Send notification to guardians.
                    if (guardianUsers?.length > 0) {
                        for (const guardian of guardianUsers) {
                            if (
                                guardian.userTopicArn &&
                                guardian.glucoseAlerts
                            ) {
                                await publishPushNotificationToUserTopicArn(
                                    guardian.userTopicArn,
                                    user.nickname
                                        ? `(${user.nickname}) ${notification.title}`
                                        : notification.title,
                                    notification.message,
                                    NOTIFICATION_ID,
                                );
                            }
                        }
                    }
                }
            }
        }
    }
    return alertName;
};

const getLowAlert = async (
    user: User,
    guardians: Guardian[],
    guardianUsers: User[],
    egv: EgvsRecord,
    lastLowAlertStatuses?: { [email: string]: boolean },
): Promise<{ [email: string]: boolean }> => {
    const lowAlertStatuses = {};
    if (egv) {
        if (
            user &&
            user.phoneNumber &&
            user.lowGlucoseAlertThreshold !== undefined &&
            egv.value < user.lowGlucoseAlertThreshold
        ) {
            if (
                !lastLowAlertStatuses ||
                lastLowAlertStatuses[user.email] !== true
            ) {
                await sendLowAlertVoiceMessage(user.phoneNumber);
            }
            lowAlertStatuses[user.email] = true;
        }
        for (let i = 0; i < guardians.length; i++) {
            const guardian = guardians[i];
            if (
                guardianUsers[i] &&
                guardianUsers[i].phoneNumber &&
                guardian.lowGlucoseAlertThreshold !== undefined &&
                egv.value < guardian.lowGlucoseAlertThreshold
            ) {
                if (
                    !lastLowAlertStatuses ||
                    lastLowAlertStatuses[guardian.guardianEmail] !== true
                ) {
                    await sendLowAlertVoiceMessage(
                        guardianUsers[i].phoneNumber,
                        true,
                    );
                }
                lowAlertStatuses[guardian.guardianEmail] = true;
            }
        }
    }
    return lowAlertStatuses;
};

const getHighAlert = async (
    user: User,
    guardians: Guardian[],
    guardianUsers: User[],
    egv: EgvsRecord,
    lastHighAlertStatuses?: { [email: string]: boolean },
): Promise<{ [email: string]: boolean }> => {
    const highAlertStatuses = {};
    if (egv) {
        if (
            user &&
            user.phoneNumber &&
            user.highGlucoseAlertThreshold !== undefined &&
            egv.value > user.highGlucoseAlertThreshold
        ) {
            if (
                !lastHighAlertStatuses ||
                lastHighAlertStatuses[user.email] !== true
            ) {
                await sendHighAlertVoiceMessage(user.phoneNumber);
            }
            highAlertStatuses[user.email] = true;
        }
        for (let i = 0; i < guardians.length; i++) {
            const guardian = guardians[i];
            if (
                guardianUsers[i] &&
                guardianUsers[i].phoneNumber &&
                guardian.highGlucoseAlertThreshold !== undefined &&
                egv.value > guardian.highGlucoseAlertThreshold
            ) {
                if (
                    !lastHighAlertStatuses ||
                    lastHighAlertStatuses[guardian.guardianEmail] !== true
                ) {
                    await sendHighAlertVoiceMessage(
                        guardianUsers[i].phoneNumber,
                        true,
                    );
                }
                highAlertStatuses[guardian.guardianEmail] = true;
            }
        }
    }
    return highAlertStatuses;
};

const checkForAlerts = async (
    session: Session,
    record: EgvsRecord,
    lastAlertStatus?: string,
    lastLowAlertStatuses?: { [email: string]: boolean },
    lastHighAlertStatuses?: { [email: string]: boolean },
): Promise<
    | {
          lastAlertStatus?: string;
          lastLowAlertStatuses?: { [email: string]: boolean };
          lastHighAlertStatuses?: { [email: string]: boolean };
      }
    | undefined
> => {
    const user = await getUser(session.email);
    const guardians = await listGuardiansForUser(session.email);
    const validGuardians: Guardian[] = [];
    const guardianUsers: User[] = [];
    for (const guardian of guardians) {
        const guardianUser = await getUser(guardian.guardianEmail);
        if (guardianUser && guardian.status !== GuardianStatus.pending) {
            validGuardians.push(guardian);
            guardianUsers.push(guardianUser);
        }
    }
    if (!session) {
        // No active dexcom session.
        return undefined;
    }
    const dexcomAlertStatus = await getDexcomAlert(
        user,
        guardianUsers,
        record,
        session,
        lastAlertStatus,
    );
    const lowAlertStatuses = await getLowAlert(
        user,
        validGuardians,
        guardianUsers,
        record,
        lastLowAlertStatuses,
    );

    const highAlertStatuses = await getHighAlert(
        user,
        validGuardians,
        guardianUsers,
        record,
        lastHighAlertStatuses,
    );

    return {
        lastAlertStatus: dexcomAlertStatus,
        lastLowAlertStatuses: lowAlertStatuses,
        lastHighAlertStatuses: highAlertStatuses,
    };
};

const processCgmRecordForSession = async (
    session: Session,
    record: EgvsRecord,
    lastAlertStatus?: string,
    lastLowAlertStatuses?: { [email: string]: boolean },
    lastHighAlertStatuses?: { [email: string]: boolean },
) => {
    let dexcomAlertStatus: string;
    let lowAlertStatuses: { [email: string]: boolean };
    let highAlertStatuses: { [email: string]: boolean };
    const result = await checkForAlerts(
        session,
        record,
        lastAlertStatus,
        lastLowAlertStatuses,
        lastHighAlertStatuses,
    );
    if (result) {
        dexcomAlertStatus = result.lastAlertStatus;
        lowAlertStatuses = result.lastLowAlertStatuses;
        highAlertStatuses = result.lastHighAlertStatuses;
    }
    if (dexcomAlertStatus || lowAlertStatuses || highAlertStatuses) {
        const redisClient = await Clients.getDexcomCache();
        const cacheKey = `status:dexcom:${session.email}`;
        try {
            await redisClient.set(
                cacheKey,
                JSON.stringify({
                    lastAlertStatus: dexcomAlertStatus,
                    lastLowAlertStatuses: lowAlertStatuses,
                    lastHighAlertStatuses: highAlertStatuses,
                }),
                {
                    EX: 3600,
                },
            );
        } catch (err) {
            console.error('Cant SET back to cache.', err);
        }
    }
};

const processCgmRecord = async (
    userId: string,
    record: EgvsRecord,
): Promise<void> => {
    const userSessions = await listSessionsByUserId(userId);
    console.log(`Processing ${userSessions.length} sessions for ${userId}`);
    for (const session of userSessions) {
        if (session.type === SessionType.dexcom) {
            const dexcomSession = session as OAuthSession;
            const now = new Date();
            if (dexcomSession.expiresAt < now.getTime() / 1000) {
                console.warn(`Session for ${session.email} has expired`);
                continue;
            }
            const redisClient = await Clients.getDexcomCache();
            const cacheKey = `status:dexcom:${session.email}`;
            let cachedData = {
                lastAlertStatus: undefined,
                lastLowAlertStatuses: undefined,
                lastHighAlertStatuses: undefined,
            };
            try {
                const redisData = await redisClient.get(cacheKey);
                if (redisData) {
                    console.log('Got from cache:', redisData);
                    cachedData = JSON.parse(redisData);
                }
            } catch (err) {
                console.error('Cant GET from cache.', err);
            }
            const {
                lastAlertStatus,
                lastLowAlertStatuses,
                lastHighAlertStatuses,
            } = cachedData;
            try {
                await processCgmRecordForSession(
                    session,
                    record,
                    lastAlertStatus,
                    lastLowAlertStatuses,
                    lastHighAlertStatuses,
                );
            } catch (err) {
                console.error(
                    `Error processing cgm record for session ${session.email}`,
                    err,
                );
            }
        }
    }
    try {
        await updateLatestEgvsDataFromDexcom(record, userId);
    } catch (err) {
        console.error('Error updating last egv record.', err);
    }
};

export const handler = async (
    event: KinesisStreamEvent,
): Promise<KinesisStreamBatchResponse> => {
    const failedMessageIds: string[] = [];
    const now = new Date();
    for (const kinesisRecord of event.Records) {
        const messageId = kinesisRecord.kinesis.sequenceNumber;
        try {
            const decodedData = Buffer.from(
                kinesisRecord.kinesis.data,
                'base64',
            ).toString('utf-8');
            const parsedBody = JSON.parse(decodedData);
            const { userId, record } = parsedBody;
            const recordAge =
                now.getTime() - new Date(record?.systemTime).getTime();
            if (recordAge < TEN_MINUTES) {
                await processCgmRecord(userId, record);
            }
        } catch (err) {
            console.error(`Cannot run dexcom job for ${messageId}`, err);
            failedMessageIds.push(messageId);
        }
    }
    return {
        batchItemFailures: failedMessageIds.map(id => ({
            itemIdentifier: id,
        })),
    };
};
