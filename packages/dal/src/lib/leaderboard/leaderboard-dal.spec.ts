import {
    getHighScoreForGame,
    incrementGameScore,
    listTopScoresForGame,
    updateGameScore,
    updateGameScoreForce,
} from './leaderboard-dal';
import Clients from '@eddii-backend/clients';

describe('updateGameScoreForce', () => {
    it('should update the score successfully', async () => {
        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockResolvedValue({ Attributes: {} });

        const result = await updateGameScoreForce(
            'game1',
            'test@example.com',
            100,
        );

        expect(result).toEqual({});
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when an unexpected error occurs', async () => {
        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Unexpected error'));

        await expect(
            updateGameScoreForce('game1', 'test@example.com', 100),
        ).rejects.toThrow('Error force updating game-score.');
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});

describe('updateGameScore', () => {
    it('should update the score successfully', async () => {
        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockResolvedValue({ Attributes: {} });

        const result = await updateGameScore('game1', 'test@example.com', 100);

        expect(result).toEqual({});
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should return undefined when ConditionalCheckFailedException occurs', async () => {
        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockResolvedValue({ name: 'ConditionalCheckFailedException' });

        const result = await updateGameScore('game1', 'test@example.com', 100);

        expect(result).toBeUndefined();
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when an unexpected error occurs', async () => {
        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Unexpected error'));

        await expect(
            updateGameScore('game1', 'test@example.com', 100),
        ).rejects.toThrow('Error updating game-score.');
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});

describe('incrementGameScore', () => {
    it('should increment the score successfully', async () => {
        const gameId = 'game1';
        const email = 'test@example.com';
        const incrementBy = 10;
        const updatedScore = incrementBy;
        const updatedAt = new Date().toISOString();

        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Attributes: {
                gameId,
                email,
                score: updatedScore,
                updatedAt,
            },
        });

        const result = await incrementGameScore(gameId, email, incrementBy);

        expect(result).toEqual({
            gameId,
            email,
            score: updatedScore,
            updatedAt,
        });
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when an unexpected error occurs', async () => {
        const gameId = 'game1';
        const email = 'test@example.com';
        const incrementBy = 10;

        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Unexpected error'));

        await expect(
            incrementGameScore(gameId, email, incrementBy),
        ).rejects.toThrow('Error incrementing game-score.');
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});

describe('listTopScoresForGame', () => {
    it('should list top scores for a game successfully', async () => {
        const mockData = [
            { gameId: 'game1', email: 'test1@example.com', score: 100 },
            { gameId: 'game1', email: 'test2@example.com', score: 200 },
        ];
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockResolvedValue({ Items: mockData });

        const [result, lastKey] = await listTopScoresForGame('game1');

        expect(result).toEqual(mockData);
        expect(lastKey).toBeUndefined();
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when an unexpected error occurs', async () => {
        const calledSpy = (
            Clients.dynamo.query({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Unexpected error'));

        await expect(listTopScoresForGame('game1')).rejects.toThrow(
            'Failed to list top scores for game.',
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});

describe('getHighScoreForGame', () => {
    it('should successfully retrieve a high score for a game', async () => {
        const mockItem = {
            gameId: 'game1',
            email: 'test@example.com',
            score: 100,
        };

        const calledSpy = (
            Clients.dynamo.get({} as any).promise as jest.Mock
        ).mockResolvedValue({ Item: mockItem });

        const result = await getHighScoreForGame('game1', 'test@example.com');
        expect(result).toEqual(mockItem);
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if DynamoDB client fails', async () => {
        const calledSpy = (
            Clients.dynamo.get({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('DynamoDB error'));

        await expect(
            getHighScoreForGame('game1', 'test@example.com'),
        ).rejects.toThrow('Failed to list top scores for game.');
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if no high score is found for a game', async () => {
        const calledSpy = (
            Clients.dynamo.get({} as any).promise as jest.Mock
        ).mockResolvedValue({});

        const result = await getHighScoreForGame('game1', 'test@example.com');
        expect(result).toBeUndefined();
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});
