import { upsertDataEntry, listDataEntries } from './data-entry-dal';
import { Feeling, FeelingEntry, FoodEntry } from './data-entry-model';
import Clients from '@eddii-backend/clients';

describe('DataEntry Service', () => {
    describe('upsertDataEntry', () => {
        it('should upsert data entries', async () => {
            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({ Attributes: {} });
            const entries = [
                new FoodEntry('test', { carbs: 100 }),
                new FoodEntry('test', { carbs: 100 }),
            ];
            await upsertDataEntry('email@example.com', '123', entries);
            expect(calledSpy).toHaveBeenCalled();
        });

        it('should throw an error if email is not provided', async () => {
            const entries = [
                new FoodEntry('test', { carbs: 100 }),
                new FoodEntry('test', { carbs: 100 }),
            ];
            await expect(upsertDataEntry('', '123', entries)).rejects.toThrow(
                'Email is required.',
            );
        });

        it('should throw an error if no data entries are provided', async () => {
            await expect(
                upsertDataEntry('email@example.com', '123', []),
            ).rejects.toThrow('No data entries provided.');
        });

        it('should throw an error if too many data entries are provided', async () => {
            const entries = new Array(101).fill(
                new FoodEntry('test', { carbs: 100 }),
            );
            await expect(
                upsertDataEntry('email@example.com', '123', entries),
            ).rejects.toThrow('Too many data entries provided.');
        });

        it('should throw an error if data entries are not of the same type', async () => {
            const entries = [
                new FoodEntry('test', { carbs: 100 }),
                new FeelingEntry(Feeling.awful),
            ];
            await expect(
                upsertDataEntry('email@example.com', '123', entries),
            ).rejects.toThrow(
                'All data entries must be of the same type. Found: foods and feelings',
            );
        });
    });

    describe('listDataEntries', () => {
        it('should list data entries', async () => {
            const items = [
                new FoodEntry('test', { carbs: 100 }),
                new FoodEntry('test', { carbs: 100 }),
            ];
            const calledSpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({ Items: items });

            const result = await listDataEntries(
                'email@example.com',
                '123',
                '123',
            );
            expect(result[0]).toEqual(items);
            expect(calledSpy).toHaveBeenCalled();
        });

        it('should throw an error if email is not provided', async () => {
            await expect(listDataEntries('', '123', '123')).rejects.toThrow(
                'Email is required.',
            );
        });

        it('should throw an error if startDate is not provided', async () => {
            await expect(
                listDataEntries('email@example.com', '', '123'),
            ).rejects.toThrow('Start timestamp is required.');
        });

        it('should throw an error if endDate is not provided', async () => {
            await expect(
                listDataEntries('email@example.com', '123', ''),
            ).rejects.toThrow('End timestamp is required.');
        });

        it('should paginate results if more than PAGE_LIMIT', async () => {
            const items = new Array(2000).fill(
                new FoodEntry('test', { carbs: 100 }),
            );
            const firstPage = items.slice(0, 1000);
            const secondPage = items.slice(1000);
            (Clients.dynamo.query({} as any).promise as jest.Mock)
                .mockResolvedValue({
                    Items: firstPage,
                    LastEvaluatedKey: { Item: 'key' },
                })
                .mockResolvedValue({
                    Items: secondPage,
                });
            const result = await listDataEntries(
                'email@example.com',
                '2022-01-01',
                '2022-01-02',
            );
            expect(result[0]).toEqual([...firstPage]);

            const result2 = await listDataEntries(
                'email@example.com',
                '2022-01-01',
                '2022-01-02',
                Buffer.from(JSON.stringify({ Item: 'key' })).toString('base64'),
            );
            expect(result2[0]).toEqual([...secondPage]);
        });

        it('should filter data entries', async () => {
            const items = [
                new FoodEntry('test', { carbs: 100 }),
                new FoodEntry('test', { carbs: 200 }),
                new FeelingEntry(Feeling.awful),
            ];
            (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({
                Items: [items[0], items[1]],
            });

            const result = await listDataEntries(
                'email@example.com',
                '2022-01-01',
                '2022-01-02',
                undefined,
                ['foods'],
            );
            expect(result[0].length).toEqual(2);
            expect(result[1]).toBeUndefined();
        });
    });
});
