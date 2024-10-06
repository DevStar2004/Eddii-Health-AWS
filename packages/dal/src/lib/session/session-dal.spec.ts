import {
    deleteSession,
    getSession,
    doesSessionExist,
    getSessionCountByUserId,
    putSession,
    listSessionsByUserId,
    scanSessionsToRefresh,
} from './session-dal';
import { Session, SessionType } from './session-model';
import Clients from '@eddii-backend/clients';

describe('putSession', () => {
    it('should put a session', async () => {
        const session: Session = {
            email: 'test@gmail.com',
            type: SessionType.dexcom,
        };
        const calledSpy = (
            Clients.dynamo.put({} as any).promise as jest.Mock
        ).mockResolvedValue({});
        await putSession(session);
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if session put fails', async () => {
        const session: Session = {
            email: 'test@gmail.com',
            type: SessionType.dexcom,
        };
        const calledSpy = (
            Clients.dynamo.put({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Failed to putting session'));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(putSession(session)).rejects.toThrow(
            'Error putting session.',
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalled();
    });
});

describe('getSession', () => {
    const email = 'test@example.com';
    const type = SessionType.dexcom;

    it('should return a session object', async () => {
        const calledSpy = (
            Clients.dynamo.get({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Item: {
                email: 'test@example.com',
                type: SessionType.dexcom,
            },
        });
        const session = await getSession(email, type);
        expect(session).toEqual({ email: email, type: type });
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the session cannot be retrieved', async () => {
        const calledSpy = (
            Clients.dynamo.get({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Failed to get session'));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(getSession(email, type)).rejects.toThrow(
            'Error getting session.',
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});

describe('doesSessionExist', () => {
    const email = 'test@example.com';

    it('should return true if the session exists', async () => {
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Count: 1,
        });
        const exists = await doesSessionExist(email);
        expect(exists).toBe(true);
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should return false if the session does not exist', async () => {
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({});
        const exists = await doesSessionExist(email);
        expect(exists).toBe(false);
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if there is an issue checking the session', async () => {
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('DynamoDB error'));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(doesSessionExist(email)).rejects.toThrow(
            'Error checking if session exists.',
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(
            `Failed to check if session exists for email: ${email}`,
            expect.any(Error),
        );
    });
});

describe('deleteSession', () => {
    it('should delete a session', async () => {
        const calledSpy = (
            Clients.dynamo.delete({} as any).promise as jest.Mock
        ).mockResolvedValue({});
        await deleteSession('test@gmail.com', SessionType.dexcom);
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if session delete fails', async () => {
        const calledSpy = (
            Clients.dynamo.delete({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Failed to delete session'));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(
            deleteSession('test@gmail.com', SessionType.dexcom),
        ).rejects.toThrow('Error deleting session.');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalled();
    });
});

describe('getSessionCountByUserId', () => {
    it('should return the count of sessions for a user', async () => {
        const userId = 'user123';
        const mockCount = 5;
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Count: mockCount,
        });
        const sessionCount = await getSessionCountByUserId(userId);
        expect(sessionCount).toEqual(mockCount);
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the query fails', async () => {
        const userId = 'user123';
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Query failed'));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(getSessionCountByUserId(userId)).rejects.toThrow(
            'Error getting sessions.',
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalled();
    });
});

describe('listSessionsByUserId', () => {
    it('should list sessions for a user by userId', async () => {
        const mockSessions = [
            {
                userId: 'user1',
                email: 'test1@gmail.com',
                type: SessionType.dexcom,
            },
            {
                userId: 'user1',
                email: 'test2@gmail.com',
                type: SessionType.dexcom,
            },
        ];
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: mockSessions,
        });
        const sessions = await listSessionsByUserId('user1');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(sessions).toEqual(mockSessions);
    });

    it('should throw an error if listing sessions fails', async () => {
        (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Failed to list sessions'));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(listSessionsByUserId('user1')).rejects.toThrow(
            'Error listing sessions.',
        );
        expect(console.error).toHaveBeenCalled();
    });
});

describe('scanSessions', () => {
    it('should scan sessions and return results without a lastEvaluatedKey', async () => {
        const mockSessions = [
            { email: 'user1@example.com', type: SessionType.dexcom },
            { email: 'user2@example.com', type: SessionType.dexcom },
        ];
        const calledSpy = (
            Clients.dynamo.scan({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: mockSessions,
        });
        const result = await scanSessionsToRefresh(new Date().getTime() / 1000);
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            sessions: mockSessions,
            lastEvaluatedKey: undefined,
        });
    });

    it('should scan sessions and return results with a lastEvaluatedKey', async () => {
        const mockSessions = [
            { email: 'user3@example.com', type: SessionType.dexcom },
            { email: 'user4@example.com', type: SessionType.dexcom },
        ];
        const lastEvaluatedKey = {
            email: 'user4@example.com',
            type: SessionType.dexcom,
        };
        const calledSpy = (
            Clients.dynamo.scan({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: mockSessions,
            LastEvaluatedKey: lastEvaluatedKey,
        });
        const result = await scanSessionsToRefresh(
            new Date().getTime() / 1000,
            Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64'),
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(result.sessions).toEqual(mockSessions);
        expect(result.lastEvaluatedKey).toEqual(
            Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64'),
        );
    });

    it('should throw an error when scan fails', async () => {
        const calledSpy = (
            Clients.dynamo.scan({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Failed to scan sessions'));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(
            scanSessionsToRefresh(new Date().getTime() / 1000),
        ).rejects.toThrow('Error scanning sessions.');
        expect(calledSpy).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalled();
    });
});
