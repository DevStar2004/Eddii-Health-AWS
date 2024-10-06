import { validSmallString, validTaskType } from '@eddii-backend/utils';
import {
    getFriendlyTaskTypeName,
    getAmountForWeeklyTask,
    setWeeklyMission,
} from './mission';
import {
    TaskLength,
    TaskType,
    addMission,
    getMission,
    getUser,
    isGuardianForUser,
} from '@eddii-backend/dal';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/notifications');

describe('Guardian Module', () => {
    //getFriendlyTaskTypeName export function test cases
    describe('Get Friendly Task Type Name export function test case', () => {
        it('should return Drink Water', () => {
            expect(getFriendlyTaskTypeName(TaskType.drinkWater)).toBe(
                'Drink Water',
            );
        });
        it('should return Medicine Entry', async () => {
            expect(getFriendlyTaskTypeName(TaskType.medicineEntry)).toEqual(
                'Medicine Entry',
            );
        });
        it('should return Exercise Entry', async () => {
            expect(getFriendlyTaskTypeName(TaskType.exerciseEntry)).toEqual(
                'Exercise Entry',
            );
        });
        it('should return Feeling Entry', async () => {
            expect(getFriendlyTaskTypeName(TaskType.feelingEntry)).toEqual(
                'Feeling Entry',
            );
        });
        it('should return Food Entry', async () => {
            expect(getFriendlyTaskTypeName(TaskType.foodEntry)).toEqual(
                'Food Entry',
            );
        });
        it('should return No Sugary Drink', async () => {
            expect(getFriendlyTaskTypeName(TaskType.noSugaryDrink)).toEqual(
                'No Sugary Drink',
            );
        });
        it('should return Data Entry', async () => {
            expect(getFriendlyTaskTypeName(TaskType.dataEntry)).toEqual(
                'Data Entry',
            );
        });
        it('should return No Eat Veggies', async () => {
            expect(getFriendlyTaskTypeName(TaskType.eatVeggies)).toEqual(
                'Eat Veggies',
            );
        });
        it('should return Other', async () => {
            expect(getFriendlyTaskTypeName(null)).toEqual('Other');
        });
    });

    // getAmountForWeeklyTask function testcase
    describe('Get Amount For Weekly Tak function test case', () => {
        it('should return o value', async () => {
            expect(getAmountForWeeklyTask(TaskType.noSugaryDrink)).toEqual(0);
        });
        it('should generate a random number between 60 and 120', () => {
            expect(
                getAmountForWeeklyTask(TaskType.exerciseEntry),
            ).toBeGreaterThanOrEqual(60);
            expect(
                getAmountForWeeklyTask(TaskType.exerciseEntry),
            ).toBeLessThanOrEqual(120);
        });
        it('should generate a random number between 6 and 12', () => {
            expect(
                getAmountForWeeklyTask(TaskType.feelingEntry),
            ).toBeGreaterThanOrEqual(6);
            expect(
                getAmountForWeeklyTask(TaskType.feelingEntry),
            ).toBeLessThanOrEqual(12);
        });
    });

    //setWeeklyMission API testcase
    describe('Set weekly mission', () => {
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

        it('Should set weekly setup', async () => {
            mockRequest = {
                guardianEmail: 'guardian@gmail.com',
                userEmail: 'user@gmail.com',
                body: {
                    taskType: 'drinkWater',
                    reward: 'testReward',
                },
            };
            (isGuardianForUser as jest.Mock).mockResolvedValue(true);
            (getUser as jest.Mock).mockResolvedValue({
                email: 'mailto:guardian@gmail.com',
            });
            const startOfWeek = new Date(
                new Date().setDate(new Date().getDate() - new Date().getDay()),
            )
                .toISOString()
                .split('T')[0];
            (getMission as jest.Mock).mockResolvedValue(null);
            (addMission as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                missionAt: startOfWeek,
                tasks: [
                    {
                        taskType: mockRequest.body.taskType,
                        taskLength: TaskLength.week,
                        reward: mockRequest.body.reward,
                        amount: 5,
                        from: mockRequest.guardianEmail,
                    },
                ],
            });
            (
                publishPushNotificationToUserTopicArn as jest.Mock
            ).mockResolvedValue(true);

            await setWeeklyMission(mockRequest, mockResponse);

            // Expectations
            expect(validTaskType(mockRequest.body.taskType));
            expect(validSmallString(mockRequest.body.reward));

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: 'user@gmail.com',
                missionAt: startOfWeek,
                tasks: [
                    {
                        taskType: 'drinkWater',
                        taskLength: 'week',
                        reward: 'testReward',
                        amount: 5,
                        from: 'guardian@gmail.com',
                    },
                ],
            });
        });

        it('Should through 400 when taskType is invalid or Empty', async () => {
            mockRequest = {
                guardianEmail: 'guardian@gmail.com',
                userEmail: 'user@gmail.com',
                body: {
                    reward: 'testReward',
                },
            };

            await setWeeklyMission(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid TaskType is required.',
            });
        });

        it('Should through 400 when Reward is empty', async () => {
            mockRequest = {
                guardianEmail: 'guardian@gmail.com',
                userEmail: 'user@gmail.com',
                body: {
                    taskType: 'drinkWater',
                },
            };

            await setWeeklyMission(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Reward is required.',
            });
        });

        it('Should through 401 when guardian is not for user', async () => {
            mockRequest = {
                guardianEmail: 'guardian@gmail.com',
                userEmail: 'user@gmail.com',
                body: {
                    taskType: 'drinkWater',
                    reward: 'testReward',
                },
            };
            (isGuardianForUser as jest.Mock).mockResolvedValue(false);

            await setWeeklyMission(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'You are not a guardian for this user.',
            });
        });

        it('Should through 404 when guardian is not found', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                guardianEmail: 'InvadlidGuardian@gmail.com',
                body: {
                    taskType: 'drinkWater',
                    reward: 'testReward',
                },
            };
            (isGuardianForUser as jest.Mock).mockResolvedValue(true);
            (getUser as jest.Mock).mockResolvedValue(false);

            await setWeeklyMission(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Guardian not found.',
            });
        });

        it('Should through 404 when weekly mission already exist', async () => {
            mockRequest = {
                userEmail: 'InvalidUser@gmail.com',
                guardianEmail: 'guardian@gmail.com',
                body: {
                    taskType: 'drinkWater',
                    reward: 'testReward',
                },
            };
            (isGuardianForUser as jest.Mock).mockResolvedValue(true);
            (getUser as jest.Mock).mockResolvedValue({
                email: 'mailto:guardian@gmail.com',
            });

            (getMission as jest.Mock).mockResolvedValue({
                tasks: [{ taskLength: 'week' }],
            });

            await setWeeklyMission(mockRequest, mockResponse);

            // Expectations
            expect(validTaskType(mockRequest.body.taskType));
            expect(validSmallString(mockRequest.body.reward));

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Weekly mission already setup.',
            });
        });
    });
});
