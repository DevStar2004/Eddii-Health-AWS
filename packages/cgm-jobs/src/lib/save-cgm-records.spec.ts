import { handler } from './save-cgm-records';
import { KinesisStreamBatchResponse } from 'aws-lambda';
import { saveDexcomEgv } from '@eddii-backend/dal';

jest.mock('@eddii-backend/dal');

describe('handler', () => {
    it('should process records and return batch item failures if any', async () => {
        const mockEvent: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '12345',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: 'user1',
                                record: { glucoseLevel: 120 },
                            }),
                        ).toString('base64'),
                    },
                },
                {
                    kinesis: {
                        sequenceNumber: '67890',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: 'user2',
                                record: { glucoseLevel: 150 },
                            }),
                        ).toString('base64'),
                    },
                },
            ],
        };

        (saveDexcomEgv as jest.Mock)
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(new Error('Failed to save'));

        const result: KinesisStreamBatchResponse = await handler(mockEvent);

        expect(result.batchItemFailures).toHaveLength(1);
        expect(result.batchItemFailures[0].itemIdentifier).toBe('67890');
        expect(saveDexcomEgv).toHaveBeenCalledTimes(2);
    });
});
