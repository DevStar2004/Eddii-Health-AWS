import { saveDexcomEgv } from '@eddii-backend/dal';
import { KinesisStreamBatchResponse, KinesisStreamEvent } from 'aws-lambda';

export const handler = async (
    event: KinesisStreamEvent,
): Promise<KinesisStreamBatchResponse> => {
    const failedMessageIds: string[] = [];
    for (const kinesisRecord of event.Records) {
        const messageId = kinesisRecord.kinesis.sequenceNumber;
        try {
            const decodedData = Buffer.from(
                kinesisRecord.kinesis.data,
                'base64',
            ).toString('utf-8');
            const parsedBody = JSON.parse(decodedData);
            const { userId, record } = parsedBody;
            await saveDexcomEgv({
                ...record,
                userId,
            });
        } catch (err) {
            console.error(`Cannot run dexcom save job for ${messageId}`, err);
            failedMessageIds.push(messageId);
        }
    }
    return {
        batchItemFailures: failedMessageIds.map(id => ({
            itemIdentifier: id,
        })),
    };
};
