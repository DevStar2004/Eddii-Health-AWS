import { deleteAllItemsForTable } from './aws';
import Clients from '@eddii-backend/clients';

describe('deleteAllItemsForTable', () => {
    it('should delete all items for a given table', async () => {
        const tableName = 'TestTable';
        const hashKey = 'TestHashKey';
        const hashValue = 'TestHashValue';
        const rangeKey = 'TestRangeKey';

        const mockQuery = (Clients.dynamo.query({} as any).promise as jest.Mock)
            .mockResolvedValueOnce({
                Items: [{ [hashKey]: hashValue, [rangeKey]: 'range1' }],
                LastEvaluatedKey: 'test',
            })
            .mockResolvedValueOnce({
                Items: [{ [hashKey]: hashValue, [rangeKey]: 'range2' }],
                LastEvaluatedKey: null,
            });

        const mockBatchWrite = (
            Clients.dynamo.batchWrite({} as any).promise as jest.Mock
        ).mockResolvedValue({});

        await deleteAllItemsForTable(tableName, hashKey, hashValue, rangeKey);

        expect(mockQuery).toBeCalledTimes(2);
        expect(mockBatchWrite).toHaveBeenCalledTimes(1);
    });
    it('should batch delete items in groups of 20', async () => {
        const tableName = 'TestTable';
        const hashKey = 'TestHashKey';
        const hashValue = 'TestHashValue';
        const rangeKey = 'TestRangeKey';
        const itemsToDelete = 45; // Total number of items to delete
        const mockItems = Array.from({ length: itemsToDelete }, (_, index) => ({
            [hashKey]: hashValue,
            [rangeKey]: `range${index}`,
        }));

        // Mock the query to return all items
        const mockQuery = (Clients.dynamo.query({} as any).promise as jest.Mock)
            .mockResolvedValueOnce({
                Items: mockItems.slice(0, 20),
                LastEvaluatedKey: 'test1',
            })
            .mockResolvedValueOnce({
                Items: mockItems.slice(20, 40),
                LastEvaluatedKey: 'test2',
            })
            .mockResolvedValueOnce({
                Items: mockItems.slice(40),
                LastEvaluatedKey: null,
            });

        // Mock the batchWrite to resolve for each batch
        const mockBatchWrite = (
            Clients.dynamo.batchWrite({} as any).promise as jest.Mock
        ).mockResolvedValue({});

        await deleteAllItemsForTable(tableName, hashKey, hashValue, rangeKey);

        // Expect the query to have been called three times to fetch all items
        expect(mockQuery).toBeCalledTimes(3);

        // Expect the batchWrite to have been called three times, once for each batch of 20 items (or the remaining items in the last batch)
        expect(mockBatchWrite).toHaveBeenCalledTimes(3);
    });
});
