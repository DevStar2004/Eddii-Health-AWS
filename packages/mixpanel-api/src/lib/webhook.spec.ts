import { cohortWebhook } from './webhook';
import {
    addStreak as addStreakToDal,
    getStreak as getStreakFromDal,
    addHeartsForUser as addHeartsForUserFromDal,
    updateGameScoreForce,
    getUser,
    incrementGameScore,
} from '@eddii-backend/dal';
import { getSecret } from '@eddii-backend/secrets';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/secrets');

describe('cohortWebhook', () => {
    let mockRequest;
    let mockResponse;
    let statusSpy;
    let jsonSpy;

    beforeEach(() => {
        statusSpy = jest.fn().mockReturnThis();
        jsonSpy = jest.fn().mockReturnThis();
        mockRequest = {
            body: { action: 'members' },
            headers: {},
        };
        mockResponse = {
            status: statusSpy,
            json: jsonSpy,
        };
        jest.clearAllMocks();
    });

    it('should return 401 if authorization header is missing', async () => {
        await cohortWebhook(mockRequest, mockResponse);
        expect(statusSpy).toHaveBeenCalledWith(401);
        expect(jsonSpy).toHaveBeenCalledWith({
            action: 'members',
            status: 'failure',
            error: {
                message: 'Authorization header missing',
                code: 401,
            },
        });
    });

    it('should return 401 if authorization credentials are invalid', async () => {
        (getSecret as jest.Mock).mockResolvedValue(
            JSON.stringify({
                username: 'testuser',
                password: 'testpass',
            }),
        );
        mockRequest.headers.authorization = 'Basic invalidcreds';
        await cohortWebhook(mockRequest, mockResponse);
        expect(statusSpy).toHaveBeenCalledWith(401);
        expect(jsonSpy).toHaveBeenCalledWith({
            action: 'members',
            status: 'failure',
            error: {
                message: 'Unauthorized',
                code: 401,
            },
        });
    });

    it('should call addStreak for each member if cohort is Daily Users and action is add_members', async () => {
        (getSecret as jest.Mock).mockResolvedValue(
            JSON.stringify({
                username: 'testuser',
                password: 'testpass',
            }),
        );
        mockRequest.headers.authorization = 'Basic dGVzdHVzZXI6dGVzdHBhc3M='; // base64 encoded testuser:testpass
        mockRequest.body = {
            action: 'add_members',
            parameters: {
                mixpanel_cohort_name: 'Daily Users',
                members: [
                    { email: 'test1@example.com' },
                    { email: 'test2@example.com' },
                ],
            },
        };
        await cohortWebhook(mockRequest, mockResponse);
        expect(addStreakToDal).toHaveBeenCalledTimes(2);
        expect(addStreakToDal).toHaveBeenCalledWith('test1@example.com');
        expect(addStreakToDal).toHaveBeenCalledWith('test2@example.com');
        expect(addHeartsForUserFromDal).not.toHaveBeenCalled();
        expect(statusSpy).toHaveBeenCalledWith(200);
        expect(jsonSpy).toHaveBeenCalledWith({
            action: 'add_members',
            status: 'success',
        });
    });

    it('should not call addStreak if streak already exists for the day', async () => {
        (getSecret as jest.Mock).mockResolvedValue(
            JSON.stringify({
                username: 'testuser',
                password: 'testpass',
            }),
        );
        (getStreakFromDal as jest.Mock).mockResolvedValue({
            email: 'test1@example.com',
            visitedAt: '2021-01-01',
        });
        mockRequest.headers.authorization = 'Basic dGVzdHVzZXI6dGVzdHBhc3M=';
        mockRequest.body = {
            action: 'add_members',
            parameters: {
                mixpanel_cohort_name: 'Daily Users',
                members: [
                    { email: 'test1@example.com' },
                    { email: 'test2@example.com' },
                ],
            },
        };
        await cohortWebhook(mockRequest, mockResponse);
        expect(addStreakToDal).not.toHaveBeenCalled();
        expect(addHeartsForUserFromDal).not.toHaveBeenCalled();
        expect(statusSpy).toHaveBeenCalledWith(200);
        expect(jsonSpy).toHaveBeenCalledWith({
            action: 'add_members',
            status: 'success',
        });
    });

    it('should increment hearts when streak is 2, 5, 15, or 30', async () => {
        (getSecret as jest.Mock).mockResolvedValue(
            JSON.stringify({
                username: 'testuser',
                password: 'testpass',
            }),
        );
        (getStreakFromDal as jest.Mock).mockResolvedValueOnce(null);
        (getStreakFromDal as jest.Mock).mockResolvedValueOnce({
            email: 'test1@example.com',
            visitedAt: '2021-01-01',
        });
        (incrementGameScore as jest.Mock).mockResolvedValueOnce({ score: 2 });
        (getUser as jest.Mock).mockResolvedValue({
            dailyHeartsLimit: 100,
            dailyHeartsLimitDate: '2021-01-01',
        });

        mockRequest.headers.authorization = 'Basic dGVzdHVzZXI6dGVzdHBhc3M=';
        mockRequest.body = {
            action: 'add_members',
            parameters: {
                mixpanel_cohort_name: 'Daily Users',
                members: [{ email: 'test1@example.com' }],
            },
        };

        await cohortWebhook(mockRequest, mockResponse);
        expect(addHeartsForUserFromDal).toHaveBeenCalledTimes(1);
    });

    it('should not call addStreak if cohort is not Daily Users', async () => {
        (getSecret as jest.Mock).mockResolvedValue(
            JSON.stringify({
                username: 'testuser',
                password: 'testpass',
            }),
        );
        mockRequest.headers.authorization = 'Basic dGVzdHVzZXI6dGVzdHBhc3M=';
        mockRequest.body = {
            action: 'add_members',
            parameters: {
                mixpanel_cohort_name: 'Other Cohort',
                members: [
                    { email: 'test1@example.com' },
                    { email: 'test2@example.com' },
                ],
            },
        };
        await cohortWebhook(mockRequest, mockResponse);
        expect(addStreakToDal).not.toHaveBeenCalled();
        expect(statusSpy).toHaveBeenCalledWith(200);
        expect(jsonSpy).toHaveBeenCalledWith({
            action: 'add_members',
            status: 'success',
        });
    });

    it('should not call addStreak if action is remove_members', async () => {
        (getSecret as jest.Mock).mockResolvedValue(
            JSON.stringify({
                username: 'testuser',
                password: 'testpass',
            }),
        );
        mockRequest.headers.authorization = 'Basic dGVzdHVzZXI6dGVzdHBhc3M=';
        mockRequest.body = {
            action: 'remove_members',
            parameters: {
                mixpanel_cohort_name: 'Daily Users',
                members: [
                    { email: 'test1@example.com' },
                    { email: 'test2@example.com' },
                ],
            },
        };
        await cohortWebhook(mockRequest, mockResponse);
        expect(addStreakToDal).not.toHaveBeenCalled();
        expect(statusSpy).toHaveBeenCalledWith(200);
        expect(jsonSpy).toHaveBeenCalledWith({
            action: 'remove_members',
            status: 'success',
        });
    });
});
