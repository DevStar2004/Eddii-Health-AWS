import { Request, Response } from 'lambda-api';
import { submitScore } from './game';
import { getUser, updateGameScore } from '@eddii-backend/dal';

jest.mock('@eddii-backend/dal');

describe('submitScore', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();
        mockRequest = {
            body: {},
        };
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };
        (getUser as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
        (updateGameScore as jest.Mock).mockResolvedValue(undefined);
    });

    it('should return 400 if body is missing', async () => {
        mockRequest.body = undefined;
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Missing Body.',
        });
    });

    it('should return 400 if game_id is missing', async () => {
        mockRequest.body = { score: 100 };
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Game ID is required.',
        });
    });

    it('should return 400 if game_id is invalid', async () => {
        mockRequest.body = { game_id: 'invalid', score: 100 };
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid Game ID.' });
    });

    it('should return 400 if score is missing', async () => {
        mockRequest.body = {
            game_id: 'eddiiBurst',
            user_id: 'test@example.com',
        };
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Score is required.',
        });
    });

    it('should return 400 if score is not a number', async () => {
        mockRequest.body = {
            game_id: 'eddiiBurst',
            score: 'not-a-number',
            user_id: 'test@example.com',
        };
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Score must be a number.',
        });
    });

    it('should return 200 if score is not valid', async () => {
        mockRequest.body = {
            game_id: 'eddiiBurst',
            score: 100,
            is_valid: false,
            user_id: 'test@example.com',
        };
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Fraudulent Score: Skipping',
        });
    });

    it('should return 400 if user_id is missing', async () => {
        mockRequest.body = {
            game_id: 'eddiiBurst',
            score: 100,
            is_valid: true,
        };
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'User ID is required.',
        });
    });

    it('should return 400 if user_id is invalid', async () => {
        mockRequest.body = {
            game_id: 'eddiiBurst',
            score: 100,
            is_valid: true,
            user_id: 'invalid',
        };
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid User ID.' });
    });

    it('should return 404 if user is not found', async () => {
        (getUser as jest.Mock).mockResolvedValue(null);
        mockRequest.body = {
            game_id: 'eddiiBurst',
            score: 100,
            is_valid: true,
            user_id: 'test@example.com',
        };
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({ message: 'User not found.' });
    });

    it('should return 200 and update score if all checks pass', async () => {
        mockRequest.body = {
            game_id: 'eddiiBurst',
            score: 100,
            is_valid: true,
            user_id: 'test@example.com',
        };
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(updateGameScore).toHaveBeenCalledWith(
            'eddiiBurst',
            'test@example.com',
            100,
        );
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Score submitted successfully',
        });
    });

    it('should return 500 if an error occurs', async () => {
        (updateGameScore as jest.Mock).mockRejectedValue(
            new Error('Test error'),
        );
        mockRequest.body = {
            game_id: 'eddiiBurst',
            score: 100,
            is_valid: true,
            user_id: 'test@example.com',
        };
        await submitScore(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Test error' });
    });
});
