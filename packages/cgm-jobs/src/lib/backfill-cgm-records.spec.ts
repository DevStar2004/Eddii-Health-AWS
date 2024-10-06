import { SQSEvent } from 'aws-lambda';
import { handler } from './backfill-cgm-records';
import { getSession, batchSaveDexcomEgvs, DexcomEgv } from '@eddii-backend/dal';
import { getRealtimeEgvsDataFromDexcom } from '@eddii-backend/dexcom';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/dexcom');

describe('backfill-cgm-records handler', () => {
    it('should process valid dexcom records and save them', async () => {
        const mockEvent: any = {
            Records: [
                {
                    body: JSON.stringify({
                        email: 'test@example.com',
                        type: 'dexcom',
                        startTimestamp: '2023-01-01T00:00:00',
                        endTimestamp: '2023-01-02T00:00:00',
                    }),
                },
            ],
        };

        const mockSession: any = {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresAt: Date.now() + 10000, // expires in future
            email: 'test@example.com',
            type: 'dexcom',
            userId: '123',
        };

        const mockEgvs: any[] = [
            {
                userId: 'test@example.com',
                recordId: '1',
                systemTime: '2023-01-01T01:00:00',
                displayTime: '2023-01-01T01:00:00',
                value: 100,
                status: 'active',
                trend: 'upward',
                trendRate: 0.5,
                unit: 'mg/dL',
                rateUnit: 'mg/dL/h',
                displayDevice: 'Dexcom G6',
                transmitterGeneration: 'G6',
            },
        ];

        (getSession as jest.Mock).mockResolvedValue(mockSession);
        (getRealtimeEgvsDataFromDexcom as jest.Mock).mockResolvedValue({
            records: mockEgvs,
        });
        (batchSaveDexcomEgvs as jest.Mock).mockResolvedValue(undefined);

        await handler(mockEvent);

        expect(getSession).toHaveBeenCalledWith('test@example.com', 'dexcom');
        expect(getRealtimeEgvsDataFromDexcom).toHaveBeenCalled();
        expect(batchSaveDexcomEgvs).toHaveBeenCalledWith(
            mockEgvs.map(egv => ({ ...egv, userId: '123' })),
        );
    });

    it('should skip records with invalid types', async () => {
        const mockEvent: any = {
            Records: [
                {
                    body: JSON.stringify({
                        email: 'test@example.com',
                        type: 'not-dexcom',
                        startTimestamp: '2023-01-01T00:00:00',
                        endTimestamp: '2023-01-02T00:00:00',
                    }),
                },
            ],
        };

        await handler(mockEvent);

        expect(getSession).not.toHaveBeenCalled();
        expect(getRealtimeEgvsDataFromDexcom).not.toHaveBeenCalled();
        expect(batchSaveDexcomEgvs).not.toHaveBeenCalled();
    });
});
