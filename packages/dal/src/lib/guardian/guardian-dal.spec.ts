import {
    createGuardian,
    deleteGuardian,
    getGuardianForUser,
    isGuardianForUser,
    listGuardiansForUser,
    listUsersForGuardian,
    updateGuardianNotificationSettings,
    updateGuardianStatus,
} from './guardian-dal';
import Clients from '@eddii-backend/clients';
import { GuardianRole, GuardianStatus } from './guardian-model';

describe('guardianDal', () => {
    describe('createGuardian', () => {
        it('should create a guardian', async () => {
            const guardianEmail = 'guardian@example.com';
            const userEmail = 'user@example.com';
            const calledSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            await createGuardian(
                guardianEmail,
                userEmail,
                GuardianStatus.active,
                GuardianRole.guardian,
            );
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if creating a guardian fails', async () => {
            const guardianEmail = 'guardian@example.com';
            const userEmail = 'user@example.com';
            const status = 'active';
            const role = 'guardian';
            const calledSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Error creating guardian.'));
            await expect(
                createGuardian(
                    guardianEmail,
                    userEmail,

                    GuardianStatus.active,
                    GuardianRole.guardian,
                ),
            ).rejects.toThrow('Error creating guardian.');
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('listUsersForGuardian', () => {
        it('should list users for a guardian', async () => {
            const guardianEmail = 'guardian@example.com';
            const items = [
                {
                    guardianEmail: guardianEmail,
                    userEmail: 'user1@example.com',
                },
                {
                    guardianEmail: guardianEmail,
                    userEmail: 'user2@example.com',
                },
            ];
            const calledSpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({ Items: items });
            const result = await listUsersForGuardian(guardianEmail);
            expect(result).toEqual(items);
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if listing users for a guardian fails', async () => {
            const guardianEmail = 'guardian@example.com';
            const calledSpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Error listing users accounts.'));
            await expect(listUsersForGuardian(guardianEmail)).rejects.toThrow(
                'Error listing users accounts.',
            );
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('listGuardiansForUser', () => {
        const userEmail = 'user@example.com';
        it('should list guardians for a user', async () => {
            const items = [
                {
                    guardianEmail: 'guardian1@example.com',
                    userEmail: userEmail,
                },
                {
                    guardianEmail: 'guardian2@example.com',
                    userEmail: userEmail,
                },
            ];
            const calledSpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({ Items: items });
            const result = await listGuardiansForUser(userEmail);
            expect(result).toEqual(items);
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if listing guardians for a user fails', async () => {
            const calledSpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Error listing guardians accounts.'));
            await expect(listGuardiansForUser(userEmail)).rejects.toThrow(
                'Error listing guardians accounts.',
            );
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('getGuardianForUser', () => {
        it('should return guardian if the guardian is associated with the user', async () => {
            const guardianEmail = 'guardian@example.com';
            const userEmail = 'user@example.com';
            const guardian = {
                guardianEmail: guardianEmail,
                userEmail: userEmail,
            };
            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({ Item: guardian });
            const result = await getGuardianForUser(guardianEmail, userEmail);
            expect(result).toBe(guardian);
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should return undefined if the guardian is not associated with the user', async () => {
            const guardianEmail = 'guardian@example.com';
            const userEmail = 'user@example.com';

            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({ Item: undefined });
            const result = await getGuardianForUser(guardianEmail, userEmail);
            expect(result).toBe(undefined);
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('isGuardianForUser', () => {
        it('should return true if the guardian is associated with the user', async () => {
            const guardianEmail = 'guardian@example.com';
            const userEmail = 'user@example.com';
            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({
                Item: {
                    guardianEmail: guardianEmail,
                    userEmail: userEmail,
                },
            });
            const result = await isGuardianForUser(guardianEmail, userEmail);
            expect(result).toBe(true);
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should return false if the guardian is not associated with the user', async () => {
            const guardianEmail = 'guardian@example.com';
            const userEmail = 'user@example.com';
            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({
                Item: undefined,
            });
            const result = await isGuardianForUser(guardianEmail, userEmail);
            expect(result).toBe(false);
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteGuardian', () => {
        const guardianEmail = 'guardian@example.com';
        const userEmail = 'user@example.com';

        it('should delete', async () => {
            const calledSpy = (
                Clients.dynamo.delete({} as any).promise as jest.Mock
            ).mockResolvedValue({});

            await deleteGuardian(guardianEmail, userEmail);

            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if delete guardian for a user fails', async () => {
            const calledSpy = (
                Clients.dynamo.delete({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Error deleting guardian.'));
            await expect(
                deleteGuardian(guardianEmail, userEmail),
            ).rejects.toThrow('Error deleting guardian.');
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateGuardianNotificationSettings', () => {
        it('should update guardian updateGuardianNotificationSettings settings', async () => {
            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            await updateGuardianNotificationSettings(
                'guardian@example.com',
                'user@example.com',
                1,
            );
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateGuardianStatus', () => {
        const guardianEmail = 'guardian@example.com';
        const userEmail = 'user@example.com';
        const status = GuardianStatus.active;

        it('should update guardian status successfully', async () => {
            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({});

            await updateGuardianStatus(guardianEmail, userEmail, status);

            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if update fails', async () => {
            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Error updating guardian status.'));

            await expect(
                updateGuardianStatus(guardianEmail, userEmail, status),
            ).rejects.toThrow('Error updating guardian status.');

            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });
});
