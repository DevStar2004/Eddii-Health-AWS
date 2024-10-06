import {
    getStoreItem,
    listStoreInventory,
    purchaseStoreItem,
    listPurchasedItems,
    redeemGiftCard,
    listGiftCardTasks,
} from './store';
import {
    ItemBundle,
    Slot,
    listStoreInventory as listStoreInventoryFromDal,
    getPurchasedItem as getPurchasedItemFromDal,
    getStoreItem as getStoreItemFromDal,
    getUser,
    purchaseItem,
    spendHearts,
    listPurchasedItems as listPurchasedItemsFromDal,
    getHighScoreForGame,
    getReferrals,
    getSubscription,
    getSession,
    listPurchasedItemsBySlot,
} from '@eddii-backend/dal';
import { getDeviceDataFromDexcom } from '@eddii-backend/dexcom';
import { getSecret } from '@eddii-backend/secrets';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/secrets');
jest.mock('@eddii-backend/dexcom');

let mockRequest = {} as any;
let mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
} as any;

beforeEach(() => {
    mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
    (getSecret as jest.Mock).mockResolvedValue(test);
    (getDeviceDataFromDexcom as jest.Mock).mockResolvedValue({
        records: [{ value: 100 }],
    });
    (getSession as jest.Mock).mockResolvedValue({});
});
afterEach(() => {
    jest.resetAllMocks();
});

describe('store Module', () => {
    describe('list Store Inventory API', () => {
        it('Should return list Store Inventory', async () => {
            const mockStoredDataInventory = [
                {
                    name: 'yellow-sneakers',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
            ];
            (listStoreInventoryFromDal as jest.Mock).mockReturnValue(
                mockStoredDataInventory,
            );

            await listStoreInventory(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                mockStoredDataInventory,
            );
        });

        it('Should return preview Store Inventory with limit', async () => {
            const mockStoredDataInventory = [
                {
                    name: 'yellow-sneakers',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
                {
                    name: 'yellow-sneakers-2',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
                {
                    name: 'yellow-sneakers-3',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
                {
                    name: 'yellow-sneakers-4',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
            ];

            mockRequest = {
                query: { itemBundleLimit: 2 },
            };

            (listStoreInventoryFromDal as jest.Mock).mockReturnValue(
                mockStoredDataInventory,
            );

            await listStoreInventory(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith([
                {
                    name: 'yellow-sneakers',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
                {
                    name: 'yellow-sneakers-2',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
            ]);
        });

        it('Should return preview Store Inventory with less items', async () => {
            const mockStoredDataInventory = [
                {
                    name: 'yellow-sneakers',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
            ];

            mockRequest = {
                query: { itemBundleLimit: 3 },
            };

            (listStoreInventoryFromDal as jest.Mock).mockReturnValue(
                mockStoredDataInventory,
            );

            await listStoreInventory(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith([
                {
                    name: 'yellow-sneakers',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
            ]);
        });

        it('Should return Store Inventory with filter', async () => {
            const mockStoredDataInventory = [
                {
                    name: 'yellow-sneakers',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
                {
                    name: 'yellow-sneakers-2',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
                {
                    name: 'yellow-sneakers-3',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
                {
                    name: 'other',
                    setId: '1',
                    itemBundle: ItemBundle.assets,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
            ];

            mockRequest = {
                multiValueQuery: {
                    itemBundle: ['Clothes'],
                },
            };

            (listStoreInventoryFromDal as jest.Mock).mockReturnValue(
                mockStoredDataInventory,
            );

            await listStoreInventory(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith([
                {
                    name: 'yellow-sneakers',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
                {
                    name: 'yellow-sneakers-2',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
                {
                    name: 'yellow-sneakers-3',
                    setId: '1',
                    itemBundle: ItemBundle.clothes,
                    cost: 20,
                    slot: Slot.eddiiShoe,
                },
            ]);
        });

        it('should return a 400 status and validate limit', async () => {
            mockRequest = {
                query: { itemBundleLimit: 10 },
            };
            await listStoreInventory(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Preview Limit must be between 0 and 6.',
            });
        });

        it('should return a 400 status and validate limit', async () => {
            mockRequest = {
                query: { itemBundleLimit: 0 },
            };
            await listStoreInventory(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Preview Limit must be between 0 and 6.',
            });
        });

        it('should return a 400 status and validate limit', async () => {
            mockRequest = {
                query: { itemBundleLimit: 'sdf' },
            };
            await listStoreInventory(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Preview Limit must be between 0 and 6.',
            });
        });
    });

    //getStoreItem API testcase
    describe('getStoreItem API', () => {
        it('Should return store item', async () => {
            mockRequest = {
                params: {
                    itemName: 'yellow-sneakers',
                    itemSlot: 'eddiiShoe',
                },
            };
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                name: 'yellow-sneakers',
                setId: '1',
                itemBundle: ItemBundle.clothes,
                cost: 20,
                slot: Slot.eddiiShoe,
            });

            await getStoreItem(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                name: 'yellow-sneakers',
                setId: '1',
                itemBundle: ItemBundle.clothes,
                cost: 20,
                slot: Slot.eddiiShoe,
            });
        });

        it('Should return 400 if item name is invalid', async () => {
            mockRequest = {
                params: {
                    itemName: null,
                },
            };

            await getStoreItem(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Item name is required.',
            });
        });

        it('Should return 400 if itemSlot is invalid', async () => {
            mockRequest = {
                params: {
                    itemName: 'yellow-sneakers',
                    itemSlot: null,
                },
            };

            await getStoreItem(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Item slot is required.',
            });
        });
    });

    describe('purchaseStoreItem', () => {
        const email = 'mailto:test@gmail.com';
        beforeEach(() => {
            (getUser as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                hearts: 5,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue(null);
            (purchaseItem as jest.Mock).mockRejectedValue(null);
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should return a 400 status and validate itemName', async () => {
            // Mock getStoreItemFromDal to return null for this specific test case.
            (getStoreItemFromDal as jest.Mock).mockReturnValue(null);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: null, itemSlot: 'eddiiShoe' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Item name is required.',
            });
        });

        it('should return a 400 status and validate itemSlot', async () => {
            // Mock getStoreItemFromDal to return null for this specific test case.
            (getStoreItemFromDal as jest.Mock).mockReturnValue(null);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: null };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Item slot is required.',
            });
        });

        it('should return a 404 status if Item not found', async () => {
            // Mock getUserFromDal to return null for this specific test case.
            (getUser as jest.Mock).mockResolvedValue({ hearts: 10 });
            (getStoreItemFromDal as jest.Mock).mockReturnValue(null);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'eddiiShoe' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Item not found.',
            });
        });

        it('should return a 400 status if Not enough hearts.', async () => {
            // Mock getUserFromDal to return null for this specific test case.
            (getUser as jest.Mock).mockResolvedValue({ hearts: 10 });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({ cost: 25 });

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'eddiiShoe' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Not enough hearts.',
            });
        });

        it('should return a 400 status if Item already purchased.', async () => {
            // Mock getUserFromDal to return null for this specific test case.
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getPurchasedItemFromDal as jest.Mock).mockResolvedValue({
                quantity: 1,
                purchasedAt: new Date().toISOString(),
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 5,
                maxQuantity: 1,
            });

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'eddiiShoe' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Item already purchased.',
            });
        });

        it('should return 400 if the item is not unlocked due to insufficient streak', async () => {
            // Mock getHighScoreForGame to return a score less than the unlock condition
            (getHighScoreForGame as jest.Mock).mockResolvedValue({
                gameId: 'streak',
                email: 'test@test.com',
                score: 1,
            });
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 5,
                unlockCondition: { streak: 2 },
            });
            (getPurchasedItemFromDal as jest.Mock).mockResolvedValue(undefined);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = {
                itemName: 'roblox-10',
                itemSlot: 'eddiiShoe',
            };
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Item not unlocked.',
            });
        });

        it('should return 400 if the item is not unlocked due no dexcom connection', async () => {
            // Mock getHighScoreForGame to return a score less than the unlock condition
            (getHighScoreForGame as jest.Mock).mockResolvedValue({
                gameId: 'streak',
                email: 'test@test.com',
                score: 1,
            });
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 5,
                unlockCondition: { cgmConnection: true },
            });
            (getPurchasedItemFromDal as jest.Mock).mockResolvedValue(undefined);
            (getSession as jest.Mock).mockResolvedValue(undefined);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'giftCardTask' };
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Must be connected to a CGM to purchase gift card.',
            });
        });

        it('should return 400 if the item is not unlocked due no dexcom connection with devices', async () => {
            // Mock getHighScoreForGame to return a score less than the unlock condition
            (getHighScoreForGame as jest.Mock).mockResolvedValue({
                gameId: 'streak',
                email: 'test@test.com',
                score: 1,
            });
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 5,
                unlockCondition: { cgmConnection: true },
            });
            (getPurchasedItemFromDal as jest.Mock).mockResolvedValue(undefined);
            (getDeviceDataFromDexcom as jest.Mock).mockResolvedValue(undefined);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'giftCardTask' };
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Must be connected to a CGM to purchase gift card.',
            });
        });

        it('should return 400 if the item is not unlocked due no referrals', async () => {
            // Mock getHighScoreForGame to return a score less than the unlock condition
            (getHighScoreForGame as jest.Mock).mockResolvedValue({
                gameId: 'streak',
                email: 'test@test.com',
                score: 1,
            });
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 5,
                unlockCondition: { cgmConnectionReferral: 1 },
            });
            (getPurchasedItemFromDal as jest.Mock).mockResolvedValue(undefined);
            (getReferrals as jest.Mock).mockResolvedValue([]);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'giftCardTask' };
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Item not unlocked.',
            });
        });

        it('should return 400 if the item is not unlocked due no sub', async () => {
            // Mock getHighScoreForGame to return a score less than the unlock condition
            (getHighScoreForGame as jest.Mock).mockResolvedValue({
                gameId: 'streak',
                email: 'test@test.com',
                score: 1,
            });
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 5,
                unlockCondition: { isPremium: true },
            });
            (getPurchasedItemFromDal as jest.Mock).mockResolvedValue(undefined);
            (getSubscription as jest.Mock).mockResolvedValue(undefined);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'giftCardTask' };
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Item not unlocked.',
            });
        });

        it('should return a 200 status purchase store item success', async () => {
            const storeItem = { name: 'test', slot: 'eddiiShoe', cost: '10' };
            // Mock getUser to return null for this specific test case.
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({ cost: 5 });
            (purchaseItem as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                itemId: 'eddiiNeck/test1',
                storeItem: storeItem,
            });
            (spendHearts as jest.Mock).mockResolvedValue({
                hearts: 5,
            });
            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test1', itemSlot: 'eddiiNeck' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                purchasedItem: {
                    email: 'mailto:test@gmail.com',
                    itemId: 'eddiiNeck/test1',
                    storeItem: {
                        name: 'test',
                        slot: 'eddiiShoe',
                        cost: '10',
                    },
                },
                user: {
                    hearts: 5,
                },
            });
        });

        it('should return a 200 status purchase store locked streak item success', async () => {
            // Mock getUser to return null for this specific test case.
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getHighScoreForGame as jest.Mock).mockResolvedValue({
                gameId: 'streak',
                email: 'test@test.com',
                score: 4,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 0,
                unlockCondition: { streak: 2 },
            });
            (purchaseItem as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                itemId: 'giftCardTask/test',
            });

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'giftCardTask' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should return a 200 status purchase store locked streak item success', async () => {
            const storeItem = { name: 'test', slot: 'eddiiShoe', cost: '10' };
            // Mock getUser to return null for this specific test case.
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getHighScoreForGame as jest.Mock).mockResolvedValue({
                gameId: 'streak',
                email: 'test@test.com',
                score: 4,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 5,
                unlockCondition: { streak: 2 },
            });
            (purchaseItem as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                itemId: 'eddiiNeck/test1',
                storeItem: storeItem,
            });
            (spendHearts as jest.Mock).mockResolvedValue({
                hearts: 5,
            });
            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = {
                itemName: 'roblox-10',
                itemSlot: 'eddiiNeck',
            };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                purchasedItem: {
                    email: 'mailto:test@gmail.com',
                    itemId: 'eddiiNeck/test1',
                    storeItem: {
                        name: 'test',
                        slot: 'eddiiShoe',
                        cost: '10',
                    },
                },
                user: {
                    hearts: 5,
                },
            });
        });

        it('should return 200 if the item with dexcom connection', async () => {
            // Mock getUser to return null for this specific test case.
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getHighScoreForGame as jest.Mock).mockResolvedValue({
                gameId: 'streak',
                email: 'test@test.com',
                score: 4,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 0,
                unlockCondition: { cgmConnection: true },
            });
            (purchaseItem as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                itemId: 'giftCardTask/test',
            });

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'giftCardTask' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should return 200 if the item with referrals', async () => {
            // Mock getUser to return null for this specific test case.
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getHighScoreForGame as jest.Mock).mockResolvedValue({
                gameId: 'streak',
                email: 'test@test.com',
                score: 4,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 0,
                unlockCondition: { cgmConnectionReferral: 1 },
            });
            (purchaseItem as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                itemId: 'giftCardTask/test',
            });
            (getReferrals as jest.Mock).mockResolvedValue([
                { referredEmail: 'test1@gmail.com' },
            ]);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'giftCardTask' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should return 200 if the item with sub', async () => {
            // Mock getUser to return null for this specific test case.
            (getUser as jest.Mock).mockResolvedValue({
                hearts: 10,
            });
            (getHighScoreForGame as jest.Mock).mockResolvedValue({
                gameId: 'streak',
                email: 'test@test.com',
                score: 4,
            });
            (getStoreItemFromDal as jest.Mock).mockReturnValue({
                cost: 0,
                unlockCondition: { isPremium: true },
            });
            (purchaseItem as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                itemId: 'giftCardTask/test',
            });
            (getSubscription as jest.Mock).mockResolvedValue({
                endDate: new Date(new Date().getTime() + 10000).toISOString(),
            });

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'giftCardTask' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await purchaseStoreItem(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });

    describe('listPurchasedItems', () => {
        const email = 'mailto:test@gmail.com';
        beforeEach(() => {
            (getUser as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                hearts: 5,
            });
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should return a 200 status with items', async () => {
            (listPurchasedItemsFromDal as jest.Mock).mockResolvedValue([
                {
                    email: 'mailto:test@gmail.com',
                    itemId: 'test',
                },
            ]);
            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await listPurchasedItems(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith([
                {
                    email: 'mailto:test@gmail.com',
                    itemId: 'test',
                },
            ]);
        });
    });

    describe('redeemGiftCard', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should redeem a gift card', async () => {
            const mockRequest = {
                userEmail: 'test@example.com',
                params: {
                    giftCardName: 'gift-card-premium',
                },
                body: {
                    giftCardType: 'roblox-10',
                },
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            (listStoreInventoryFromDal as jest.Mock).mockReturnValue([
                {
                    name: 'roblox-10',
                    itemBundle: ItemBundle.redeemableGiftCards,
                },
            ]);

            (getStoreItemFromDal as jest.Mock)
                .mockReturnValue({
                    name: 'gift-card-premium',
                    itemBundle: ItemBundle.giftCardsTasks,
                    cost: 20,
                    slot: Slot.giftCardTask,
                })
                .mockReturnValue({
                    name: 'roblox-10',
                    itemBundle: ItemBundle.redeemableGiftCards,
                    cost: 20,
                    slot: Slot.redeemableGiftCard,
                });

            (getPurchasedItemFromDal as jest.Mock).mockResolvedValue({
                quantity: 1,
                storeItem: {
                    name: 'gift-card-premium',
                    itemBundle: ItemBundle.giftCardsTasks,
                    slot: Slot.giftCardTask,
                },
            });

            await redeemGiftCard(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should redeem a gift card if unlocked', async () => {
            const mockRequest = {
                userEmail: 'test@example.com',
                params: {
                    giftCardName: 'gift-card-premium',
                },
                body: {
                    giftCardType: 'roblox-10',
                },
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            (listStoreInventoryFromDal as jest.Mock).mockReturnValue([
                {
                    name: 'roblox-10',
                    itemBundle: ItemBundle.redeemableGiftCards,
                },
            ]);

            (getStoreItemFromDal as jest.Mock)
                .mockReturnValue({
                    name: 'gift-card-premium',
                    itemBundle: ItemBundle.giftCardsTasks,
                    cost: 20,
                    slot: Slot.giftCardTask,
                })
                .mockReturnValue({
                    name: 'roblox-10',
                    itemBundle: ItemBundle.redeemableGiftCards,
                    slot: Slot.redeemableGiftCard,
                    unlockCondition: { daysSinceLastPurchase: 5 },
                });

            (getPurchasedItemFromDal as jest.Mock)
                .mockResolvedValue({
                    quantity: 1,
                    storeItem: {
                        name: 'gift-card-premium',
                        itemBundle: ItemBundle.giftCardsTasks,
                        slot: Slot.giftCardTask,
                    },
                })
                .mockResolvedValue({
                    quantity: 2,
                    purchasedAt: new Date(
                        new Date().getTime() - 6 * 24 * 60 * 60 * 1000,
                    ).toISOString(),
                    storeItem: {
                        name: 'roblox-10',
                        itemBundle: ItemBundle.redeemableGiftCards,
                        slot: Slot.redeemableGiftCard,
                    },
                });

            await redeemGiftCard(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should 400 if already redeem a gift card', async () => {
            const mockRequest = {
                userEmail: 'test@example.com',
                params: {
                    giftCardName: 'gift-card-premium',
                },
                body: {
                    giftCardType: 'roblox-10',
                },
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            (listStoreInventoryFromDal as jest.Mock).mockReturnValue([
                {
                    name: 'roblox-10',
                    itemBundle: ItemBundle.redeemableGiftCards,
                },
            ]);

            (getStoreItemFromDal as jest.Mock)
                .mockReturnValueOnce({
                    name: 'gift-card-premium',
                    itemBundle: ItemBundle.giftCardsTasks,
                    cost: 20,
                    slot: Slot.giftCardTask,
                })
                .mockReturnValueOnce({
                    name: 'roblox-10',
                    itemBundle: ItemBundle.redeemableGiftCards,
                    cost: 20,
                    slot: Slot.redeemableGiftCard,
                });

            (getPurchasedItemFromDal as jest.Mock)
                .mockResolvedValueOnce({
                    quantity: 1,
                    redeemCount: 1,
                    storeItem: {
                        name: 'gift-card-premium',
                        itemBundle: ItemBundle.giftCardsTasks,
                        slot: Slot.giftCardTask,
                    },
                })
                .mockResolvedValueOnce({
                    quantity: 2,
                    storeItem: {
                        name: 'roblox-10',
                        setId: '1',
                        itemBundle: ItemBundle.redeemableGiftCards,
                        slot: Slot.redeemableGiftCard,
                    },
                });

            await redeemGiftCard(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should 400 if already not unlocked', async () => {
            const mockRequest = {
                userEmail: 'test@example.com',
                params: {
                    giftCardName: 'gift-card-premium',
                },
                body: {
                    giftCardType: 'roblox-10',
                },
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            (listStoreInventoryFromDal as jest.Mock).mockReturnValue([
                {
                    name: 'roblox-10',
                    itemBundle: ItemBundle.redeemableGiftCards,
                },
            ]);

            (getStoreItemFromDal as jest.Mock)
                .mockReturnValueOnce({
                    name: 'gift-card-premium',
                    itemBundle: ItemBundle.giftCardsTasks,
                    cost: 20,
                    slot: Slot.giftCardTask,
                })
                .mockReturnValueOnce({
                    name: 'roblox-10',
                    itemBundle: ItemBundle.redeemableGiftCards,
                    slot: Slot.redeemableGiftCard,
                    unlockCondition: { daysSinceLastPurchase: 5 },
                });

            (getPurchasedItemFromDal as jest.Mock)
                .mockResolvedValueOnce({
                    quantity: 1,
                    storeItem: {
                        name: 'gift-card-premium',
                        itemBundle: ItemBundle.giftCardsTasks,
                        slot: Slot.giftCardTask,
                    },
                })
                .mockResolvedValueOnce({
                    quantity: 2,
                    purchasedAt: new Date().toISOString(),
                    storeItem: {
                        name: 'roblox-10',
                        itemBundle: ItemBundle.redeemableGiftCards,
                        slot: Slot.redeemableGiftCard,
                    },
                });

            await redeemGiftCard(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 status if gift card name is not valid', async () => {
            const mockRequest = {
                userEmail: 'test@example.com',
                params: { giftCardName: undefined },
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await redeemGiftCard(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 status if gift card is not found', async () => {
            const mockRequest = {
                userEmail: 'test@example.com',
                params: { giftCardName: 'Nonexistent Gift Card' },
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await redeemGiftCard(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });
    });
});

describe('listGiftCardTasks', () => {
    it('should return all gift card tasks with unlock conditions and quantities', async () => {
        const mockEmail = 'test@example.com';
        const mockRequest = { userEmail: mockEmail } as any;
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as any;

        const mockGiftCardTasks = [
            {
                email: mockEmail,
                itemId: 'giftCardTask/gift-card-cgm-connection',
                quantity: 1,
                storeItem: {
                    name: 'gift-card-cgm-connection',
                    slot: Slot.giftCardTask,
                    unlockCondition: { cgmConnection: true },
                },
            },
            {
                email: mockEmail,
                itemId: 'giftCardTask/gift-card-premium',
                quantity: 0,
                storeItem: {
                    name: 'gift-card-premium',
                    slot: Slot.giftCardTask,
                    unlockCondition: { isPremium: true },
                },
            },
        ];

        (listStoreInventoryFromDal as jest.Mock).mockReturnValue(
            mockGiftCardTasks.map(task => task.storeItem),
        );
        (listPurchasedItemsBySlot as jest.Mock).mockResolvedValue(
            mockGiftCardTasks,
        );

        await listGiftCardTasks(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    itemId: 'giftCardTask/gift-card-cgm-connection',
                    storeItem: expect.objectContaining({
                        unlockCondition: expect.objectContaining({
                            cgmConnection: true,
                            progress: 1,
                        }),
                    }),
                }),
                expect.objectContaining({
                    itemId: 'giftCardTask/gift-card-premium',
                    storeItem: expect.objectContaining({
                        unlockCondition: expect.objectContaining({
                            isPremium: true,
                            progress: 0,
                        }),
                    }),
                }),
            ]),
        );
    });

    it('should return disabled gift card tasks if owned', async () => {
        const mockEmail = 'test@example.com';
        const mockRequest = { userEmail: mockEmail } as any;
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as any;

        const mockGiftCardTasks = [
            {
                email: mockEmail,
                itemId: 'giftCardTask/disabled-gift-card',
                quantity: 1,
                storeItem: {
                    name: 'disabled-gift-card',
                    slot: Slot.giftCardTask,
                    disabled: true,
                },
            },
        ];

        (listStoreInventoryFromDal as jest.Mock).mockReturnValue(
            mockGiftCardTasks.map(task => task.storeItem),
        );
        (listPurchasedItemsBySlot as jest.Mock).mockResolvedValue(
            mockGiftCardTasks,
        );

        await listGiftCardTasks(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    itemId: 'giftCardTask/disabled-gift-card',
                }),
            ]),
        );
    });

    it('should not return disabled gift card tasks', async () => {
        const mockEmail = 'test@example.com';
        const mockRequest = { userEmail: mockEmail } as any;
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as any;

        const mockGiftCardTasks = [
            {
                email: mockEmail,
                itemId: 'giftCardTask/disabled-gift-card',
                quantity: 1,
                storeItem: {
                    name: 'disabled-gift-card',
                    slot: Slot.giftCardTask,
                    disabled: true,
                },
            },
        ];

        (listStoreInventoryFromDal as jest.Mock).mockReturnValue(
            mockGiftCardTasks.map(task => task.storeItem),
        );
        (listPurchasedItemsBySlot as jest.Mock).mockResolvedValue([]);

        await listGiftCardTasks(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.not.arrayContaining([
                expect.objectContaining({
                    itemId: 'giftCardTask/disabled-gift-card',
                }),
            ]),
        );
    });
});
