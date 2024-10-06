import { createReferral, getReferrals } from './referral-dal';
import { getDynamoClient } from '../../aws';
import { Referral } from './referral-model';

jest.mock('../../aws', () => ({
    getDynamoClient: jest.fn(),
}));

describe('Referral DAL', () => {
    const mockPutPromise = jest.fn();
    const mockQueryPromise = jest.fn();
    const ddbDocClient = {
        put: jest.fn(() => ({ promise: mockPutPromise })),
        query: jest.fn(() => ({ promise: mockQueryPromise })),
    };

    beforeEach(() => {
        (getDynamoClient as jest.Mock).mockReturnValue(ddbDocClient);
        jest.clearAllMocks();
    });

    describe('createReferral', () => {
        it('should create a referral and return the referral object', async () => {
            const referringEmail = 'referrer@example.com';
            const referredEmail = 'referred@example.com';
            const referralTime = new Date().toISOString();

            mockPutPromise.mockResolvedValueOnce({});

            const result = await createReferral(referringEmail, referredEmail);

            expect(getDynamoClient).toHaveBeenCalledTimes(1);
            expect(ddbDocClient.put).toHaveBeenCalledWith({
                TableName: process.env['REFERRAL_TABLE_NAME'],
                Item: {
                    referringEmail,
                    referredEmail,
                    referredAt: expect.any(String),
                },
            });
            expect(result).toHaveProperty('referringEmail', referringEmail);
            expect(result).toHaveProperty('referredEmail', referredEmail);
            expect(result).toHaveProperty('referredAt');
            expect(
                Math.abs(
                    new Date(result.referredAt).getTime() -
                        new Date(referralTime).getTime(),
                ),
            ).toBeLessThan(5000);
        });

        it('should throw an error if the put operation fails', async () => {
            const referringEmail = 'referrer@example.com';
            const referredEmail = 'referred@example.com';
            const error = new Error('Error creating referral.');

            mockPutPromise.mockRejectedValueOnce(error);

            await expect(
                createReferral(referringEmail, referredEmail),
            ).rejects.toThrow('Error creating referral.');
        });
    });

    describe('getReferrals', () => {
        it('should return a list of referrals for the given email', async () => {
            const referringEmail = 'referrer@example.com';
            const referrals: Referral[] = [
                {
                    referringEmail,
                    referredEmail: 'referred1@example.com',
                    referredAt: new Date().toISOString(),
                },
                {
                    referringEmail,
                    referredEmail: 'referred2@example.com',
                    referredAt: new Date().toISOString(),
                },
            ];

            mockQueryPromise.mockResolvedValueOnce({ Items: referrals });

            const result = await getReferrals(referringEmail);

            expect(getDynamoClient).toHaveBeenCalledTimes(1);
            expect(ddbDocClient.query).toHaveBeenCalledWith({
                TableName: process.env['REFERRAL_TABLE_NAME'],
                KeyConditionExpression: 'referringEmail = :referringEmail',
                ExpressionAttributeValues: {
                    ':referringEmail': referringEmail,
                },
            });
            expect(result).toEqual(referrals);
        });

        it('should throw an error if the query operation fails', async () => {
            const referringEmail = 'referrer@example.com';
            const error = new Error('Error getting referrals.');

            mockQueryPromise.mockRejectedValueOnce(error);

            await expect(getReferrals(referringEmail)).rejects.toThrow(
                'Error getting referrals.',
            );
        });
    });
});
