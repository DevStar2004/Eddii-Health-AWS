import {
    createSubscription,
    getSubscription,
    getSubscriptionByTxId,
} from './subscription-dal';
import { AppleSubscription } from './subscription-model';
import Clients from '@eddii-backend/clients';

describe('Apple mission-dal', () => {
    describe('createSubscription', () => {
        it('should add a subscription', async () => {
            const mockSubscription = new AppleSubscription(
                'test@example.com',
                '2021-01-01',
                '2021-02-01',
                'com.example.product',
                '1234',
            );
            const putSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            await createSubscription(mockSubscription);
            expect(putSpy).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if subscription is not provided', async () => {
            const mockSubscription = new AppleSubscription(
                '',
                '2021-01-01',
                '2021-02-01',
                'com.example.product',
                '1234',
            );
            await expect(createSubscription(mockSubscription)).rejects.toThrow(
                'Subscription is required.',
            );
        });

        it('should throw an error if adding subscription fails', async () => {
            const mockSubscription = new AppleSubscription(
                'test@example.com',
                '2021-01-01',
                '2021-02-01',
                'com.example.product',
                '1234',
            );
            (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Failed to add subscription'));
            await expect(createSubscription(mockSubscription)).rejects.toThrow(
                'Error adding subscription.',
            );
        });
    });

    describe('getSubscription', () => {
        it('should get a subscription', async () => {
            const mockSubscription = new AppleSubscription(
                'test@example.com',
                '2021-01-01',
                '2021-02-01',
                'com.example.product',
                '1234',
            );
            const getSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({ Item: mockSubscription });
            const result = await getSubscription(mockSubscription.email);
            expect(getSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockSubscription);
        });

        it('should get free subscription if none exists', async () => {
            const mockSubscription = new AppleSubscription(
                'test@example.com',
                '2021-01-01',
                '2021-02-01',
                'com.example.product',
                '1234',
            );
            const getSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({ Item: undefined });
            const result = await getSubscription(mockSubscription.email);
            expect(getSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual(undefined);
        });

        it('should throw an error if email is not provided', async () => {
            await expect(getSubscription('')).rejects.toThrow(
                'Email is required.',
            );
        });

        it('should throw an error if getting subscription fails', async () => {
            const mockSubscription = new AppleSubscription(
                'test@example.com',
                '2021-01-01',
                '2021-02-01',
                'com.example.product',
                '1234',
            );
            (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Failed to get subscription'));
            await expect(
                getSubscription(mockSubscription.email),
            ).rejects.toThrow('Error getting subscription.');
        });
    });

    describe('getSubscriptionByTxId', () => {
        it('should return subscription if it exists', async () => {
            const mockSubscription = new AppleSubscription(
                'test@example.com',
                '2021-01-01',
                '2021-02-01',
                'com.example.product',
                '1234',
            );
            const querySpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({ Items: [mockSubscription] });
            const result = await getSubscriptionByTxId('test-id');
            expect(querySpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockSubscription);
        });

        it('should return undefined if subscription does not exist', async () => {
            const querySpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({ Items: [] });
            const result = await getSubscriptionByTxId('test-id');
            expect(querySpy).toHaveBeenCalledTimes(1);
            expect(result).toBeUndefined();
        });

        it('should throw an error if DynamoDB operation fails', async () => {
            (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('DynamoDB error'));
            await expect(getSubscriptionByTxId('test-id')).rejects.toThrow(
                'Failed to get subscription by tx.',
            );
        });
    });
});
