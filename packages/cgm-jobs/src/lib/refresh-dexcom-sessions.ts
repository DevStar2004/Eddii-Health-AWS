import { OAuthSession, scanSessionsToRefresh } from '@eddii-backend/dal';
import { refreshAndStoreDexcomSession } from '@eddii-backend/dexcom';
import { getSecret } from '@eddii-backend/secrets';
import Clients from '@eddii-backend/clients';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSEvent } from 'aws-lambda';

export const searchDexcomSessions = async () => {
    let lastEvaluatedKey: string | undefined = undefined;
    const userSessions = [];
    const now = new Date().getTime() / 1000 + 30 * 60;
    do {
        const result = await scanSessionsToRefresh(now, lastEvaluatedKey);
        userSessions.push(...result.sessions);
        lastEvaluatedKey = result.lastEvaluatedKey;
    } while (lastEvaluatedKey);

    const dexcomSessions = userSessions.filter(
        session => session.type === 'dexcom',
    );
    console.log(`Found ${dexcomSessions.length} dexcom sessions`);
    for (const session of dexcomSessions) {
        const command = new SendMessageCommand({
            MessageBody: JSON.stringify(session),
            QueueUrl: process.env['DEXCOM_REFRESH_QUEUE_URL'],
            MessageGroupId: session.email,
            MessageDeduplicationId: session.email,
        });

        try {
            await Clients.sqs.send(command);
            console.log(`Session for ${session.email} sent to SQS`);
        } catch (error) {
            console.error(
                `Failed to send session for ${session.email} to SQS`,
                error,
            );
        }
    }

    console.log('Finished searching dexcom sessions');
};

export const refreshDexcomSessions = async (event: SQSEvent) => {
    const dexcomSecret = await getSecret(process.env['DEXCOM_SECRET']);
    for (const record of event.Records) {
        const session: OAuthSession = JSON.parse(record.body);
        console.log(`Refreshing session for ${session.email}`);
        try {
            await refreshAndStoreDexcomSession(
                session as OAuthSession,
                dexcomSecret,
            );
        } catch (e) {
            console.error(`Error refreshing session for ${session.email}`, e);
        }
    }
    console.log('Finished refreshing dexcom sessions');
};
