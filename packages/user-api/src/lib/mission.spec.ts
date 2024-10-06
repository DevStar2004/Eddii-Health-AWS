import {
    completeTaskForDailyMission,
    completeTaskForWeeklyMission,
    generateDailyMission,
    getDailyMissionStatus,
    getMission,
    getWeeklyMissionStatus,
    requestWeeklyMission,
} from './mission';
import {
    addMission,
    getMission as getMissionFromDal,
    getUser,
    isGuardianForUser,
} from '@eddii-backend/dal';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/notifications');
// jest.mock('./mission');

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

describe('Mission Module', () => {
    //generateDailyMission API testcase
    describe('generate Daily Mission API', () => {
        it('Should generate 404 if mission is already geenrated', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (getMissionFromDal as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                missionAt: '2023-10-02',
                tasks: [
                    {
                        taskType: 'feelingEntry',
                        taskLength: 'day',
                        amount: 4,
                        reward: 'twoHearts',
                    },
                    {
                        taskType: 'medicineEntry',
                        taskLength: 'day',
                        amount: 3,
                        reward: 'twoHearts',
                    },
                ],
            });

            (addMission as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                missionAt: '2023-10-02',
                tasks: [
                    {
                        taskType: 'feelingEntry',
                        taskLength: 'day',
                        amount: 4,
                        reward: 'twoHearts',
                    },
                    {
                        taskType: 'medicineEntry',
                        taskLength: 'day',
                        amount: 3,
                        reward: 'twoHearts',
                    },
                ],
            });

            await generateDailyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Daily missions already generated.',
            });
        });

        it('Should generate Daily Mission', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (getMissionFromDal as jest.Mock).mockResolvedValue(undefined);

            (addMission as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                missionAt: '2023-10-02',
                tasks: [
                    {
                        taskType: 'feelingEntry',
                        taskLength: 'day',
                        amount: 4,
                        reward: 'twoHearts',
                    },
                    {
                        taskType: 'medicineEntry',
                        taskLength: 'day',
                        amount: 3,
                        reward: 'twoHearts',
                    },
                ],
            });

            await generateDailyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: 'user@gmail.com',
                missionAt: '2023-10-02',
                tasks: [
                    {
                        taskType: 'feelingEntry',
                        taskLength: 'day',
                        amount: 4,
                        reward: 'twoHearts',
                    },
                    {
                        taskType: 'medicineEntry',
                        taskLength: 'day',
                        amount: 3,
                        reward: 'twoHearts',
                    },
                ],
            });
        });
    });

    //getDailyMissionStatus API testcase
    describe('get Daily Mission Status API', () => {
        // it('Should get Daily Mission Status', async () => {
        //     mockRequest = {
        //         userEmail: 'user@gmail.com',
        //     };
        //     (getMissionFromDal as jest.Mock).mockResolvedValue({
        //         email: 'user@gmail.com',
        //         missionAt: '2023-10-02',
        //         tasks: [
        //             {
        //               taskType: 'foodEntry',
        //               taskLength: 'day',
        //               amount: 2,
        //               reward: 'twoHearts'
        //             },
        //             {
        //               taskType: 'dataEntry',
        //               taskLength: 'day',
        //               amount: 2,
        //               reward: 'twoHearts'
        //             },
        //             {
        //               taskType: 'feelingEntry',
        //               taskLength: 'day',
        //               amount: 4,
        //               reward: 'twoHearts'
        //             },
        //             {
        //               taskType: 'medicineEntry',
        //               taskLength: 'day',
        //               amount: 3,
        //               reward: 'twoHearts'
        //             }
        //         ]
        //     });

        //     await getDailyMissionStatus(mockRequest, mockResponse);

        //     // Expectations
        //     expect(mockResponse.status).toHaveBeenCalledWith(200);
        //     expect(mockResponse.json).toHaveBeenCalledWith({
        //         email: 'user@gmail.com',
        //         missionAt: '2023-10-02',
        //         tasks: [
        //             {
        //               taskType: 'foodEntry',
        //               taskLength: 'day',
        //               amount: 2,
        //               reward: 'twoHearts'
        //             },
        //             {
        //               taskType: 'dataEntry',
        //               taskLength: 'day',
        //               amount: 2,
        //               reward: 'twoHearts'
        //             },
        //             {
        //               taskType: 'feelingEntry',
        //               taskLength: 'day',
        //               amount: 4,
        //               reward: 'twoHearts'
        //             },
        //             {
        //               taskType: 'medicineEntry',
        //               taskLength: 'day',
        //               amount: 3,
        //               reward: 'twoHearts'
        //             }
        //         ]
        //     });
        // });

        it('Should generate 404 if mission is not exist', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (getMissionFromDal as jest.Mock).mockResolvedValue(undefined);

            await getDailyMissionStatus(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Daily missions not found.',
            });
        });
    });

    //getMission API testcase
    describe('get Mission  API', () => {
        it('Should get mission', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                query: {
                    missionAt: '2023-10-02',
                },
            };
            (getMissionFromDal as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                missionAt: '2023-10-02',
            });

            await getMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: 'user@gmail.com',
                missionAt: '2023-10-02',
            });
        });

        it('Should generate 400 if missionAt is empty', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                query: {
                    missionAt: null,
                },
            };

            await getMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'MissionAt is required.',
            });
        });

        it('Should generate 400 if missionAt is Invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                query: {
                    missionAt: 'Invalid',
                },
            };

            await getMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid MissionAt time format.',
            });
        });

        it('Should generate 404 if mission not found', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                query: {
                    missionAt: '2023-10-02',
                },
            };
            (getMissionFromDal as jest.Mock).mockResolvedValue(undefined);

            await getMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Mission not found.',
            });
        });
    });

    //completeTaskForDailyMission API testcase
    describe('complete Task For Daily Mission  API', () => {
        it('Should return 400 if taskType is invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    taskType: 'Invalid',
                },
            };

            await completeTaskForDailyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid TaskType is required.',
            });
        });

        it('Should return 404 if daily mission task not found', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    taskType: 'medicineEntry',
                },
            };

            const todayMissionAt = new Date().toISOString().split('T')[0];

            (getMissionFromDal as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                missionAt: todayMissionAt,
                tasks: [
                    {
                        taskType: 'feelingEntry',
                        taskLength: 'day',
                        amount: 4,
                        reward: 'twoHearts',
                    },
                    {
                        taskType: 'inValidTaskType',
                        taskLength: 'day',
                        amount: 3,
                        reward: 'twoHearts',
                    },
                ],
            });

            await completeTaskForDailyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Daily mission task not found.',
            });
        });

        it('Should return 400 if task is already completed', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    taskType: 'medicineEntry',
                },
            };

            const todayMissionAt = new Date().toISOString().split('T')[0];

            (getMissionFromDal as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                missionAt: todayMissionAt,
                tasks: [
                    {
                        taskType: 'feelingEntry',
                        taskLength: 'day',
                        amount: 4,
                        reward: 'twoHearts',
                    },
                    {
                        taskType: 'medicineEntry',
                        taskLength: 'day',
                        amount: 3,
                        reward: 'twoHearts',
                        completed: true,
                    },
                ],
            });

            await completeTaskForDailyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Task already completed.',
            });
        });

        // it('Should complete Task For Daily Mission', async () => {
        //     mockRequest = {
        //         userEmail: 'user@gmail.com',
        //         params: {
        //             taskType: 'medicineEntry',
        //         }
        //     };

        //     const todayMissionAt = new Date().toISOString().split('T')[0];

        //     (getMissionFromDal as jest.Mock).mockResolvedValue({
        //         email: 'user@gmail.com',
        //         missionAt: todayMissionAt,
        //         tasks: [
        //             {
        //                 taskType: 'feelingEntry',
        //                 taskLength: 'day',
        //                 amount: 4,
        //                 reward: 'twoHearts',
        //             },
        //             {
        //                 taskType: 'medicineEntry',
        //                 taskLength: 'day',
        //                 amount: 3,
        //                 reward: 'twoHearts',
        //             },
        //         ],
        //     });

        //     await completeTaskForDailyMission(mockRequest, mockResponse);

        //     // Expectations
        //     expect(mockResponse.status).toHaveBeenCalledWith(404);
        //     expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Daily mission task not found.' });
        // });
    });

    //requestWeeklyMission API testcase
    describe('request Weekly Mission  API', () => {
        it('Should generate 400 if Guardian email is Invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    guardianEmail: 'Invalid',
                },
            };

            await requestWeeklyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Guardian email is required.',
            });
        });

        it('Should generate 401 if User is not a guardian.', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    guardianEmail: 'guardian@gmail.com',
                },
            };

            (isGuardianForUser as jest.Mock).mockResolvedValue(false);

            await requestWeeklyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User is not a guardian.',
            });
        });

        it('Should generate 404 if Guardian user not found.', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    guardianEmail: 'guardian@gmail.com',
                },
            };
            (isGuardianForUser as jest.Mock).mockResolvedValue(true);

            (getUser as jest.Mock).mockResolvedValue(false);

            await requestWeeklyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Guardian user not found.',
            });
        });

        it('Should return 404 if Weekly mission already setup.', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    guardianEmail: 'guardian@gmail.com',
                },
            };
            (isGuardianForUser as jest.Mock).mockResolvedValue(true);

            (getUser as jest.Mock).mockResolvedValue({
                email: 'guardian@gmail.com',
            });

            // Get ISOString of the start of the week
            const startOfWeek = new Date(
                new Date().setDate(new Date().getDate() - new Date().getDay()),
            )
                .toISOString()
                .split('T')[0];

            (getMissionFromDal as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                missionAt: startOfWeek,
                tasks: [
                    {
                        taskType: 'foodEntry',
                        taskLength: 'week',
                        amount: 2,
                        reward: 'twoHearts',
                    },
                    {
                        taskType: 'dataEntry',
                        taskLength: 'week',
                        amount: 2,
                        reward: 'twoHearts',
                    },
                ],
            });

            await requestWeeklyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Weekly mission already setup.',
            });
        });

        it('Should request Weekly mission', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    guardianEmail: 'guardian@gmail.com',
                },
            };
            (isGuardianForUser as jest.Mock).mockResolvedValue(true);

            (getUser as jest.Mock).mockResolvedValue({
                email: 'guardian@gmail.com',
            });

            // Get ISOString of the start of the week
            const startOfWeek = new Date(
                new Date().setDate(new Date().getDate() - new Date().getDay()),
            )
                .toISOString()
                .split('T')[0];

            (getMissionFromDal as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                missionAt: startOfWeek,
                tasks: [
                    {
                        taskType: 'foodEntry',
                        taskLength: 'day',
                        amount: 2,
                        reward: 'twoHearts',
                    },
                    {
                        taskType: 'dataEntry',
                        taskLength: 'day',
                        amount: 2,
                        reward: 'twoHearts',
                    },
                ],
            });

            (
                publishPushNotificationToUserTopicArn as jest.Mock
            ).mockResolvedValue(true);

            await requestWeeklyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Weekly mission requested.',
            });
        });
    });

    //getWeeklyMissionStatus API testcase
    describe('get Weekly Mission Status API', () => {
        // it('Should get Weekly Mission Status', async () => {
        //     const userEmail = 'user@gmail.com';

        //     // const currentDate = new Date();
        //     // const startOfWeek = new Date(currentDate);
        //     // startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        //     // const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

        //     mockRequest = {
        //         userEmail,
        //     };

        //     (getMissionFromDal as jest.Mock).mockResolvedValue({
        //         email: userEmail,
        //         missionAt: '2023-10-02',
        //         tasks: [
        //             {
        //                 taskType: 'foodEntry',
        //                 taskLength: 'week',
        //                 amount: 2,
        //                 reward: 'twoHearts',
        //             },
        //             {
        //                 taskType: 'dataEntry',
        //                 taskLength: 'week',
        //                 amount: 2,
        //                 reward: 'twoHearts',
        //             },
        //             {
        //                 taskType: 'feelingEntry',
        //                 taskLength: 'week',
        //                 amount: 4,
        //                 reward: 'twoHearts',
        //             },
        //             {
        //                 taskType: 'medicineEntry',
        //                 taskLength: 'week',
        //                 amount: 3,
        //                 reward: 'twoHearts',
        //             },
        //         ],
        //     });

        //     await getWeeklyMissionStatus(mockRequest, mockResponse);

        //     // Expectations
        //     expect(mockResponse.status).toHaveBeenCalledWith(200);
        //     expect(mockResponse.json).toHaveBeenCalledWith({
        //         email: 'user@gmail.com',
        //         missionAt: '2023-10-02',
        //         tasks: [
        //             {
        //                 taskType: 'foodEntry',
        //                 taskLength: 'week',
        //                 amount: 2,
        //                 reward: 'twoHearts',
        //             },
        //             {
        //                 taskType: 'dataEntry',
        //                 taskLength: 'week',
        //                 amount: 2,
        //                 reward: 'twoHearts',
        //             },
        //             {
        //                 taskType: 'feelingEntry',
        //                 taskLength: 'week',
        //                 amount: 4,
        //                 reward: 'twoHearts',
        //             },
        //             {
        //                 taskType: 'medicineEntry',
        //                 taskLength: 'week',
        //                 amount: 3,
        //                 reward: 'twoHearts',
        //             },
        //         ],
        //     });
        // });

        it('Should generate 404 if mission is not exist', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (getMissionFromDal as jest.Mock).mockResolvedValue(undefined);

            await getWeeklyMissionStatus(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Weekly mission not found.',
            });
        });
    });

    //completeTaskForWeeklyMission API testcase
    describe('complete Task For Weekly Mission  API', () => {
        it('Should return 400 if From Email is invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    from: 'Invalid',
                },
            };

            await completeTaskForWeeklyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid From Email is required.',
            });
        });

        it('Should return 404 if weekly mission task not found', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    from: 'from@gmail.com',
                },
            };

            const startOfWeek = new Date(
                new Date().setDate(new Date().getDate() - new Date().getDay()),
            )
                .toISOString()
                .split('T')[0];

            (getMissionFromDal as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                missionAt: startOfWeek,
                tasks: [
                    {
                        taskType: 'feelingEntry',
                        taskLength: 'day',
                        amount: 4,
                        reward: 'twoHearts',
                        from: 'from@gmail.com',
                    },
                    {
                        taskType: 'inValidTaskType',
                        taskLength: 'day',
                        amount: 3,
                        reward: 'twoHearts',
                        from: 'from@gmail.com',
                    },
                ],
            });

            await completeTaskForWeeklyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Weekly mission not found.',
            });
        });

        it('Should return 400 if task is already completed', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    from: 'from@gmail.com',
                },
            };

            const todayMissionAt = new Date().toISOString().split('T')[0];

            (getMissionFromDal as jest.Mock).mockResolvedValue({
                email: 'user@gmail.com',
                missionAt: todayMissionAt,
                tasks: [
                    {
                        taskType: 'feelingEntry',
                        taskLength: 'day',
                        amount: 4,
                        reward: 'twoHearts',
                        from: 'from@gmail.com',
                    },
                    {
                        taskType: 'medicineEntry',
                        taskLength: 'week',
                        amount: 3,
                        reward: 'twoHearts',
                        from: 'from@gmail.com',
                        completed: true,
                    },
                ],
            });

            await completeTaskForWeeklyMission(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Task already completed.',
            });
        });

        // it('Should complete Task For weekly Mission', async () => {
        //     mockRequest = {
        //         userEmail: 'user@gmail.com',
        //         params: {
        //             from: 'from@gmail.com',
        //         },
        //     };

        //     const todayMissionAt = new Date().toISOString().split('T')[0];

        //     (getMissionFromDal as jest.Mock).mockResolvedValue({
        //         email: 'user@gmail.com',
        //         missionAt: todayMissionAt,
        //         tasks: [
        //             {
        //                 taskType: 'feelingEntry',
        //                 taskLength: 'week',
        //                 amount: 4,
        //                 reward: 'twoHearts',
        //                 from: 'from@gmail.com',
        //             },
        //             {
        //                 taskType: 'medicineEntry',
        //                 taskLength: 'week',
        //                 amount: 3,
        //                 reward: 'twoHearts',
        //                 from: 'from@gmail.com',
        //             },
        //         ],
        //     });

        //     await completeTaskForWeeklyMission(mockRequest, mockResponse);

        //     // Expectations
        //     expect(mockResponse.status).toHaveBeenCalledWith(404);
        //     expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Daily mission task not found.' });
        // });
    });
});
