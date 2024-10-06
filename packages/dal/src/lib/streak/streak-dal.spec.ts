import { addStreak, getStreak, listStreaks } from './streak-dal';
import { Streak } from './streak-model';
import Clients from '@eddii-backend/clients';

describe('streak-dal', () => {
    const email = 'test@example.com';
    const startTimestamp = '2022-01-01';
    const endTimestamp = '2022-01-31';
    const streak: Streak = {
        email,
        visitedAt: '2022-01-01',
    };

    describe('addStreak', () => {
        it('should add a streak to the database', async () => {
            const calledSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            await addStreak(email);
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if email is not provided', async () => {
            await expect(addStreak('')).rejects.toThrow('Email is required.');
        });

        it('should throw an error if there is an error adding the streak', async () => {
            (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Error adding streak.'));
            await expect(addStreak(email)).rejects.toThrow(
                'Error adding streak.',
            );
        });
    });

    describe('getStreak', () => {
        const visitedAt = '2022-01-01';

        it('should get a streak from the database', async () => {
            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({ Item: streak });
            const result = await getStreak(email, visitedAt);
            expect(result).toEqual(streak);
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if email is not provided', async () => {
            await expect(getStreak('', visitedAt)).rejects.toThrow(
                'Email is required.',
            );
        });

        it('should throw an error if visitedAt is not provided', async () => {
            await expect(getStreak(email, '')).rejects.toThrow(
                'VisitedAt is required.',
            );
        });

        it('should throw an error if there is an error getting the streak', async () => {
            (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Error getting streak.'));
            await expect(getStreak(email, visitedAt)).rejects.toThrow(
                'Error getting streak.',
            );
        });
    });

    describe('listStreaks', () => {
        it('should list streaks from the database', async () => {
            const calledSpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({ Items: [streak] });
            const [streaks, page] = await listStreaks(
                email,
                startTimestamp,
                endTimestamp,
            );
            expect(streaks).toEqual([streak]);
            expect(page).toBeUndefined();
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if email is not provided', async () => {
            await expect(
                listStreaks('', startTimestamp, endTimestamp),
            ).rejects.toThrow('Email is required.');
        });

        it('should throw an error if start timestamp is not provided', async () => {
            await expect(listStreaks(email, '', endTimestamp)).rejects.toThrow(
                'Start date is required.',
            );
        });

        it('should throw an error if end timestamp is not provided', async () => {
            await expect(
                listStreaks(email, startTimestamp, ''),
            ).rejects.toThrow('End date is required.');
        });

        it('should return a page token if there are more results', async () => {
            const calledSpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({
                Items: [streak],
                LastEvaluatedKey: {
                    email,
                    visitedAt: '2022-01-02',
                },
            });
            const [streaks, page] = await listStreaks(
                email,
                startTimestamp,
                endTimestamp,
            );
            expect(streaks).toEqual([streak]);
            expect(page).toBeDefined();
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });
});
