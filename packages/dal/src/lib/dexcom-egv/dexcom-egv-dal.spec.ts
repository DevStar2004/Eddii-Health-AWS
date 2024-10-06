import Clients from '@eddii-backend/clients';
import {
    saveDexcomEgv,
    listDexcomEgvs,
    batchSaveDexcomEgvs,
} from './dexcom-egv-dal';
import { DexcomEgv } from './dexcom-egv-model';

describe('DexcomEgv Data Access Layer', () => {
    const mockDexcomEgv: DexcomEgv = {
        userId: '123',
        recordId: '123',
        systemTime: '2023-01-01T00:00:00Z',
        displayTime: '2023-01-01T00:00:00Z',
        transmitterId: 'TX123',
        transmitterTicks: 123456,
        value: 100,
        status: 'active',
        trend: 'upward',
        trendRate: 0.5,
        unit: 'mg/dL',
        rateUnit: 'mg/dL/h',
        displayDevice: 'Dexcom G6',
        transmitterGeneration: 'G6',
    };

    describe('saveDexcomEgv', () => {
        it('should save a DexcomEgv record successfully', async () => {
            const calledSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockResolvedValue({});

            const result = await saveDexcomEgv(mockDexcomEgv);

            expect(result).toEqual(mockDexcomEgv);
            expect(calledSpy).toHaveBeenCalled();
        });

        it('should throw an error when saving fails', async () => {
            const error = new Error('Failed to save');
            (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockRejectedValue(error);

            await expect(saveDexcomEgv(mockDexcomEgv)).rejects.toThrow(
                'Error while saving dexcom egv.',
            );
        });
    });

    describe('batchSaveDexcomEgvs', () => {
        it('should successfully batch save multiple DexcomEgv records', async () => {
            const mockDexcomEgvs = Array.from({ length: 50 }, (_, index) => ({
                ...mockDexcomEgv,
                recordId: `123-${index}`,
            }));
            const calledSpy = (
                Clients.dynamo.batchWrite({} as any).promise as jest.Mock
            ).mockResolvedValue({});

            await batchSaveDexcomEgvs(mockDexcomEgvs);

            expect(calledSpy).toHaveBeenCalledTimes(2);
        });

        it('should throw an error when batch saving fails', async () => {
            const mockDexcomEgvs = [mockDexcomEgv];
            const calledSpy = (
                Clients.dynamo.batchWrite({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Batch write failed'));

            await expect(batchSaveDexcomEgvs(mockDexcomEgvs)).rejects.toThrow(
                'Error while batch saving dexcom egvs.',
            );
        });
    });

    describe('listDexcomEgvs', () => {
        it('should return a list of DexcomEgv records and a pagination token', async () => {
            const userId = '123';
            const startTimestamp = '2023-01-01T00:00:00Z';
            const endTimestamp = '2023-01-02T00:00:00Z';
            const mockDexcomEgvs: any[] = [
                mockDexcomEgv,
                {
                    ...mockDexcomEgv,
                    systemTime: '2023-01-01T01:05:00Z',
                },
            ];
            const lastEvaluatedKey = {
                userId: '123',
                systemTime: '2023-01-01T02:00:00Z',
            };
            const calledSpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({
                Items: mockDexcomEgvs,
                LastEvaluatedKey: lastEvaluatedKey,
            });

            const [result, token] = await listDexcomEgvs(
                userId,
                startTimestamp,
                endTimestamp,
            );

            expect(result).toEqual(mockDexcomEgvs);
            expect(token).toEqual(
                Buffer.from(JSON.stringify(lastEvaluatedKey)).toString(
                    'base64',
                ),
            );
            expect(calledSpy).toHaveBeenCalled();
        });

        it('should handle errors when listing fails', async () => {
            const userId = '123';
            const startTimestamp = '2023-01-01T00:00:00Z';
            const endTimestamp = '2023-01-02T00:00:00Z';
            (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Query failed'));

            await expect(
                listDexcomEgvs(userId, startTimestamp, endTimestamp),
            ).rejects.toThrow('Error while listing dexcom egvs.');
        });
    });
});
