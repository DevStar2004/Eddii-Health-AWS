import {
    searchDexcomSessions,
    refreshDexcomSessions,
} from './refresh-dexcom-sessions';
import { scanSessionsToRefresh } from '@eddii-backend/dal';
import { getSecret } from '@eddii-backend/secrets';
import Clients from '@eddii-backend/clients';
import { refreshAndStoreDexcomSession } from '@eddii-backend/dexcom';
import { SQSEvent } from 'aws-lambda';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/dexcom');
jest.mock('@eddii-backend/secrets');

describe('searchDexcomSessions', () => {
    it('should refresh all dexcom sessions', async () => {
        const mockDexcomSecret = 'mockDexcomSecret';
        (getSecret as jest.Mock).mockResolvedValue(mockDexcomSecret);
        const mockSessions = [
            { type: 'dexcom', email: 'user1@example.com' },
            { type: 'dexcom', email: 'user2@example.com' },
            { type: 'other', email: 'user3@example.com' },
        ];
        (Clients.sqs.send as jest.Mock).mockResolvedValueOnce({});
        (scanSessionsToRefresh as jest.Mock).mockResolvedValueOnce({
            sessions: mockSessions,
            lastEvaluatedKey: undefined,
        });

        await searchDexcomSessions();

        expect(scanSessionsToRefresh).toHaveBeenCalled();
        expect(Clients.sqs.send).toHaveBeenCalledTimes(2);
    });

    it('should handle no sessions found', async () => {
        (getSecret as jest.Mock).mockResolvedValue('mockDexcomSecret');
        (Clients.sqs.send as jest.Mock).mockResolvedValueOnce({});
        (scanSessionsToRefresh as jest.Mock).mockResolvedValueOnce({
            sessions: [],
            lastEvaluatedKey: undefined,
        });

        await searchDexcomSessions();

        expect(scanSessionsToRefresh).toHaveBeenCalled();
        expect(Clients.sqs.send).not.toHaveBeenCalled();
    });

    it('should handle errors during session refresh', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const error = new Error('Test error');
        (getSecret as jest.Mock).mockResolvedValue('mockDexcomSecret');
        (scanSessionsToRefresh as jest.Mock).mockResolvedValueOnce({
            sessions: [{ type: 'dexcom', email: 'user1@example.com' }],
            lastEvaluatedKey: undefined,
        });
        (Clients.sqs.send as jest.Mock).mockRejectedValue(error);

        await searchDexcomSessions();

        expect(consoleSpy).toHaveBeenCalledWith(
            'Session for user1@example.com sent to SQS',
        );
        expect(consoleSpy).toHaveBeenCalledWith(
            'Finished searching dexcom sessions',
        );
        expect(Clients.sqs.send).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});

describe('refreshDexcomSessions', () => {
    it('should refresh valid sessions', async () => {
        const mockEvent = {
            Records: [
                {
                    body: JSON.stringify({
                        email: 'user1@example.com',
                        type: 'dexcom',
                    }),
                },
                {
                    body: JSON.stringify({
                        email: 'user2@example.com',
                        type: 'dexcom',
                    }),
                },
            ],
        };
        const dexcomSecret = 'mockDexcomSecret';
        (getSecret as jest.Mock).mockResolvedValue(dexcomSecret);
        (refreshAndStoreDexcomSession as jest.Mock).mockResolvedValue({});

        await refreshDexcomSessions(mockEvent as unknown as SQSEvent);

        expect(getSecret).toHaveBeenCalledWith(process.env['DEXCOM_SECRET']);
        expect(refreshAndStoreDexcomSession).toHaveBeenCalledTimes(2);
        expect(refreshAndStoreDexcomSession).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ email: 'user1@example.com' }),
            dexcomSecret,
        );
        expect(refreshAndStoreDexcomSession).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ email: 'user2@example.com' }),
            dexcomSecret,
        );
    });

    it('should handle errors during session refresh', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const mockEvent = {
            Records: [
                {
                    body: JSON.stringify({
                        email: 'user1@example.com',
                        type: 'dexcom',
                    }),
                },
            ],
        };
        const dexcomSecret = 'mockDexcomSecret';
        const error = new Error('Refresh failed');
        (getSecret as jest.Mock).mockResolvedValue(dexcomSecret);
        (refreshAndStoreDexcomSession as jest.Mock).mockRejectedValue(error);

        await refreshDexcomSessions(mockEvent as unknown as SQSEvent);

        expect(refreshAndStoreDexcomSession).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'user1@example.com' }),
            dexcomSecret,
        );
        expect(consoleSpy).toHaveBeenCalledWith(
            `Error refreshing session for user1@example.com`,
            error,
        );
        consoleSpy.mockRestore();
    });
});
