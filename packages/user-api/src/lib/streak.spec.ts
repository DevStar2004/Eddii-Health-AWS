import { addStreak, getCurrentStreak, listStreaks } from './streak';

import {
    addStreak as addStreakToDal,
    getHighScoreForGame,
    getStreak as getStreakFromDal,
    listStreaks as listStreaksFromDal,
} from '@eddii-backend/dal';

jest.mock('@eddii-backend/dal');

let mockRequest = {} as any;
let mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
} as any;

beforeEach(() => {
    mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
});
afterEach(() => {
    jest.resetAllMocks();
});

describe('Streak Module', () => {
    //listStreaks API testcase
    describe('list Streaks  API', () => {
        it('Should generate 400 if startDate is empty', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                query: {
                    startDate: null,
                    endDate: '2023-10-02',
                    page: '5',
                },
            };

            await listStreaks(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'StartDate is required.',
            });
        });

        it('Should generate 400 if endDate is empty', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                query: {
                    startDate: '2023-10-02',
                    endDate: null,
                    page: '5',
                },
            };

            await listStreaks(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'EndDate is required.',
            });
        });

        it('Should generate 400 if startDate is Invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                query: {
                    startDate: 'Invalid',
                    endDate: '2023-10-02',
                    page: '5',
                },
            };

            await listStreaks(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid StartDate time format.',
            });
        });

        it('Should generate 400 if endDate is Invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                query: {
                    startDate: '2023-10-02',
                    endDate: 'Invalid',
                    page: '5',
                },
            };

            await listStreaks(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid EndDate time format.',
            });
        });
    });

    //addStreak API testcase
    describe('add Streak API', () => {
        it('Should generate 200 if Streak already exists.', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };

            const todayVisitedAt = new Date().toISOString().split('T')[0];

            (getStreakFromDal as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                visitedAt: todayVisitedAt,
            });
            await addStreak(mockRequest, mockResponse);

            // Expectations
            expect(addStreakToDal).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                streak: { visitedAt: todayVisitedAt, email: 'user@gmail.com' },
                user: undefined,
            });
        });

        it('Should add streak', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };

            const todayVisitedAt = new Date().toISOString().split('T')[0];

            (getStreakFromDal as jest.Mock).mockResolvedValue(null);
            (addStreakToDal as jest.Mock).mockResolvedValue({
                visitedAt: todayVisitedAt,
                email: 'user@gmail.com',
            });

            await addStreak(mockRequest, mockResponse);

            // Expectations
            expect(addStreakToDal).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                streak: { visitedAt: todayVisitedAt, email: 'user@gmail.com' },
                user: undefined,
            });
        });
    });
});

describe('get Current Streak API', () => {
    it('Should generate 200 if Streak already exists.', async () => {
        mockRequest = {
            userEmail: 'user@gmail.com',
        };

        const todayVisitedAt = new Date().toISOString().split('T')[0];

        (getHighScoreForGame as jest.Mock).mockResolvedValue({
            score: 1,
            updatedAt: new Date().toISOString(),
        });

        await getCurrentStreak(mockRequest, mockResponse);

        // Expectations
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            currentStreak: 1,
            lastVisitedAt: todayVisitedAt,
        });
    });

    it('Should generate 200 if Streak doesnt exists.', async () => {
        mockRequest = {
            userEmail: 'user@gmail.com',
        };

        const todayVisitedAt = new Date().toISOString().split('T')[0];

        await getCurrentStreak(mockRequest, mockResponse);

        // Expectations
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            currentStreak: 0,
            lastVisitedAt: null,
        });
    });
});
