import {
    purchaseItem,
    listStoreInventory,
    listPurchasedItems,
    hasPurchasedItem,
    getPurchasedItem,
    redeemGiftCard,
    listPurchasedItemsBySlot,
} from './store-dal';
import Clients from '@eddii-backend/clients';

describe('Items Validation Check', () => {
    test('should not have duplicates for composite key of item.slot/item.name', () => {
        const compositeKeys = new Set();

        listStoreInventory().forEach(item => {
            const compositeKey = `${item.slot}/${item.name}`;

            expect(compositeKeys.has(compositeKey)).toBe(false);

            compositeKeys.add(compositeKey);
        });
    });
});

describe('purchaseItem', () => {
    test('successful purchase', async () => {
        const calledSpy = (
            Clients.dynamo.put({} as any).promise as jest.Mock
        ).mockResolvedValue({});
        const result = await purchaseItem('test@test.com', 'item1');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined();
        expect(result.storeItem).toBeUndefined();
    });

    test('successful purchase with item', async () => {
        const calledSpy = (
            Clients.dynamo.put({} as any).promise as jest.Mock
        ).mockResolvedValue({});
        const result = await purchaseItem(
            'test@test.com',
            'eddiiColor/original',
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined();
        expect(result.storeItem).toBeDefined();
    });

    test('purchase error', async () => {
        const calledSpy = (
            Clients.dynamo.put({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Error purchasing item.'));
        await expect(purchaseItem('test@test.com', 'item1')).rejects.toThrow(
            'Error purchasing item.',
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});

describe('listPurchasedItems', () => {
    test('items found', async () => {
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: [{ email: 'test@test.com', itemId: 'item1' }],
        });
        const result = await listPurchasedItems('test@test.com');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(1);
    });

    test('no items found', async () => {
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({ Items: [] });
        const result = await listPurchasedItems('test@test.com');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(0);
    });
});

describe('listPurchasedItemsBySlot', () => {
    test('items found for given slot', async () => {
        const email = 'test@test.com';
        const itemSlot = 'eddiiColor';
        const mockItems = [
            {
                email: email,
                itemId: `${itemSlot}/original`,
                quantity: 1,
            },
        ];
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({ Items: mockItems });
        const result = await listPurchasedItemsBySlot(email, itemSlot);
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(1);
        expect(result[0].itemId).toContain(itemSlot);
    });

    test('no items found for given slot', async () => {
        const email = 'test@test.com';
        const itemSlot = 'eddiiColor';
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({ Items: [] });
        const result = await listPurchasedItemsBySlot(email, itemSlot);
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(0);
    });

    test('error thrown when getting items by slot', async () => {
        const email = 'test@test.com';
        const itemSlot = 'eddiiColor';
        const errorMessage = 'Error getting purchased items by slot.';
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error(errorMessage));
        await expect(listPurchasedItemsBySlot(email, itemSlot)).rejects.toThrow(
            errorMessage,
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});

describe('getPurchasedItem', () => {
    test('item found', async () => {
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: [
                {
                    email: 'test@test.com',
                    itemId: 'item1',
                    quantity: 1,
                },
            ],
        });
        const result = await getPurchasedItem('test@test.com', 'item1');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined;
    });

    test('item not found', async () => {
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({ Items: [] });
        const result = await getPurchasedItem('test@test.com', 'item1');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined;
    });
});

describe('hasPurchasedItem', () => {
    test('item found', async () => {
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: [
                {
                    email: 'test@test.com',
                    itemId: 'item1',
                    quantity: 1,
                },
            ],
        });
        const result = await hasPurchasedItem('test@test.com', 'item1');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toBe(1);
    });

    test('item not found', async () => {
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({ Items: [] });
        const result = await hasPurchasedItem('test@test.com', 'item1');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toBe(0);
    });
});

describe('redeemGiftCard', () => {
    test('gift card redeemed', async () => {
        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Attributes: {
                email: 'test@test.com',
                itemId: 'item1',
                quantity: 1,
            },
        });
        const result = await redeemGiftCard('test@test.com', 'item1');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined;
    });

    test('gift card not redeemed', async () => {
        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Error redeeming gift card.'));
        await expect(redeemGiftCard('test@test.com', 'item1')).rejects.toThrow(
            'Error redeeming gift card.',
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});
