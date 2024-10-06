import { saveChatLog, listChatsLogs, listLatestChatsLogs } from './chat-dal';
import Clients from '@eddii-backend/clients';
import { Chat } from './chat-model';

describe('chat-dal', () => {
    it('should save a chat logs', async () => {
        const chatHistory: Chat = {
            email: 'test@example.com',
            entryAt: new Date().toISOString(),
            prompt: 'Hi there!',
            response: 'Hello! How can I assist you today?',
        };

        const calledSpy = (
            Clients.dynamo.put({} as any).promise as jest.Mock
        ).mockResolvedValue({});

        await saveChatLog(chatHistory);

        expect(calledSpy).toHaveBeenCalled();
    });
});

describe('listChatsLogs', () => {
    it('should return a list of chat logs and a next page token if more records exist', async () => {
        const email = 'test@example.com';
        const mockChats = [
            {
                email: email,
                entryAt: new Date().toISOString(),
                prompt: 'Hi there!',
                response: 'Hello! How can I assist you today?',
            },
            // ... more chat items
        ];
        const mockLastEvaluatedKey = {
            email: email,
            entryAt: mockChats[mockChats.length - 1].entryAt,
        };

        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: mockChats,
            LastEvaluatedKey: mockLastEvaluatedKey,
        });

        const [result, nextPageToken] = await listChatsLogs(email);

        expect(calledSpy).toHaveBeenCalled();
        expect(result).toEqual(mockChats);
        expect(nextPageToken).toEqual(
            Buffer.from(JSON.stringify(mockLastEvaluatedKey)).toString(
                'base64',
            ),
        );
    });

    it('should return an empty array and no next page token if no records exist', async () => {
        const email = 'test@example.com';

        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: [],
        });

        const [result, nextPageToken] = await listChatsLogs(email);

        expect(calledSpy).toHaveBeenCalled();
        expect(result).toEqual([]);
        expect(nextPageToken).toBeUndefined();
    });

    it('should use the lastEvaluatedKey for pagination when a page token is provided', async () => {
        const email = 'test@example.com';
        const pageToken = Buffer.from(
            JSON.stringify({
                email: email,
                entryAt: '2023-01-01T00:00:00.000Z',
            }),
        ).toString('base64');

        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: [],
            LastEvaluatedKey: undefined,
        });

        await listChatsLogs(email, pageToken);

        expect(calledSpy).toHaveBeenCalled();
    });

    it('should throw an error when the dynamo query fails', async () => {
        const email = 'test@example.com';
        const errorMessage = 'Error listing chat logs.';

        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error(errorMessage));

        await expect(listChatsLogs(email)).rejects.toThrow(errorMessage);
        expect(calledSpy).toHaveBeenCalled();
    });
});

describe('listLatestChatsLogs', () => {
    it('should retrieve the latest chat logs', async () => {
        const email = 'test@example.com';
        const mockChats = [
            {
                email: email,
                entryAt: new Date().toISOString(),
                role: 'user',
                content: 'Hi there!',
            },
            {
                email: email,
                entryAt: new Date().toISOString(),
                role: 'assistant',
                content: 'Hello! How can I assist you today?',
            },
        ];

        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: mockChats,
        });

        const result = await listLatestChatsLogs(email);

        expect(calledSpy).toHaveBeenCalled();
        expect(result).toEqual(mockChats);
    });

    it('should return an empty array if no chats are found', async () => {
        const email = 'test@example.com';

        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Items: [],
        });

        const result = await listLatestChatsLogs(email);
        expect(calledSpy).toHaveBeenCalled();
        expect(result).toEqual([]);
    });
});
