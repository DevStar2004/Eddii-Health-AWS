import { ItemBundle, Slot } from '../store/store-model';
import {
    createUser,
    getUser,
    equipStoreItemForUser,
    resetStoreItemsForUser,
    addHeartsForUser,
    spendHearts,
    updateUserProfile,
    updateUserNotificationSettings,
    batchGetUserProfiles,
} from './user-dal';
import { User } from './user-model';
import Clients from '@eddii-backend/clients';

describe('User DAL', () => {
    describe('createUser', () => {
        it('should create a new user', async () => {
            const calledSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            const newUser = new User('newuser@example.com');
            await createUser(newUser);
            expect(calledSpy).toHaveBeenCalled();
        });

        it('should throw an error when creating a user with an existing email', async () => {
            const calledSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('User already exists.'));
            const existingUser = new User('newuser@example.com');
            await expect(createUser(existingUser)).rejects.toThrow(
                'Error creating user.',
            );
            expect(calledSpy).toHaveBeenCalled();
        });
    });

    describe('getUser', () => {
        it('should get an existing user', async () => {
            const newUser = new User('newuser@example.com');
            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({ Item: newUser });
            const user = await getUser('newuser@example.com');
            expect(user).toEqual(newUser);
            expect(calledSpy).toHaveBeenCalled();
        });

        it('should return undefined getting a non-existent user', async () => {
            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            const user = await getUser('nonexistent@example.com');
            expect(user).toEqual(undefined);
            expect(calledSpy).toHaveBeenCalled();
        });
    });

    describe('equipStoreItemForUser', () => {
        it('should equip a store item for a user', async () => {
            const testUser = new User('newuser@example.com');
            const testItem = {
                name: 'test',
                setId: '1',
                cost: 10,
                slot: Slot.eddiiBottomLeft,
                itemBundle: ItemBundle.assets,
                maxQuantity: 1,
            };
            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            await equipStoreItemForUser(testUser.email, testItem);
            expect(calledSpy).toHaveBeenCalled();
        });
    });

    describe('resetStoreItemsForUser', () => {
        it('should reset eddii for a user', async () => {
            const testUser = new User('newuser@example.com');
            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            await resetStoreItemsForUser(testUser.email);
            expect(calledSpy).toHaveBeenCalled();
        });
    });

    describe('addHeartsForUser', () => {
        it('should add hearts for user', async () => {
            const email = 'test@example.com';
            const heartsToAdd = 5;

            const user = new User(email);
            const updateSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({ Attributes: user });

            const result = await addHeartsForUser(
                email,
                heartsToAdd,
                user.dailyHeartsLimit,
                user.dailyHeartsLimitDate,
            );

            expect(result).toBeDefined();
            expect(updateSpy).toHaveBeenCalled();
        });

        it('should not add hearts for user when at limit', async () => {
            const email = 'test@example.com';
            const heartsToAdd = 5;

            const user = new User(email);
            user.dailyHeartsLimit = 0;
            const updateSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({});

            const result = await addHeartsForUser(
                email,
                heartsToAdd,
                user.dailyHeartsLimit,
                user.dailyHeartsLimitDate,
            );

            expect(result).toBeUndefined();
            expect(updateSpy).not.toHaveBeenCalled();
        });

        it('should add hearts for user when at limit but resetting', async () => {
            const email = 'test@example.com';
            const heartsToAdd = 5;

            const user = new User(email);
            user.dailyHeartsLimit = 0;
            user.dailyHeartsLimitDate = new Date(
                Date.now() - 24 * 60 * 60 * 1000,
            )
                .toISOString()
                .split('T')[0];
            const updateSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({ Attributes: user });

            const result = await addHeartsForUser(
                email,
                heartsToAdd,
                user.dailyHeartsLimit,
                user.dailyHeartsLimitDate,
            );

            expect(result).toBeDefined();
            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('spendHearts', () => {
        it('should spend hearts for a user', async () => {
            const email = 'test@example.com';
            const heartsToSpend = 5;

            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({ Attributes: { email } });

            const result = await spendHearts(email, heartsToSpend);

            expect(result).toBeDefined();
            expect(calledSpy).toHaveBeenCalled();
        });
    });

    describe('updateUserProfile', () => {
        it('should update the user profile', async () => {
            const testUser = new User('newuser@example.com');
            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            await updateUserProfile({
                email: testUser.email,
                nickname: 'test',
                locale: 'test',
            });
            expect(calledSpy).toHaveBeenCalled();
        });
    });

    describe('updateUserNotificationSettings', () => {
        it('should update the user notification settings', async () => {
            const testUser = new User('newuser@example.com');
            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            await updateUserNotificationSettings(
                testUser.email,
                true,
                undefined,
            );
            expect(calledSpy).toHaveBeenCalled();
        });
    });

    describe('batchGetUserProfiles', () => {
        it('should get user profiles in batches of 100', async () => {
            const mockUsers = Array(200)
                .fill(0)
                .map((_, i) => ({
                    email: `user${i}@example.com`,
                    nickname: `user${i}`,
                    avatar: `avatar${i}`,
                }));

            const calledSpy = (
                Clients.dynamo.batchGet({} as any).promise as jest.Mock
            )
                .mockResolvedValueOnce({
                    Responses: {
                        [process.env['USER_TABLE_NAME'] as string]:
                            mockUsers.slice(0, 100),
                    },
                })
                .mockResolvedValueOnce({
                    Responses: {
                        [process.env['USER_TABLE_NAME'] as string]:
                            mockUsers.slice(100, 200),
                    },
                });

            const emails = mockUsers.map(user => user.email);
            const users = await batchGetUserProfiles(emails);

            expect(users).toEqual(mockUsers);
            expect(calledSpy).toHaveBeenCalledTimes(2);
        });
    });
});
