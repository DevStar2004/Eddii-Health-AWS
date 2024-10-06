import {
    equipStoreItemForUserEddii,
    resetItemsForUserEddii,
    playGame,
    finishQuiz,
    updateUserProfile,
    updateUserNotificationSettings,
    getUser,
} from './user';
import {
    getUser as getUserFromDal,
    equipStoreItemForUser as equipStoreItemForUserFromDal,
    resetStoreItemsForUser,
    spendHearts,
    addHeartsForUser as addHeartsForUserFromDal,
    updateUserProfile as updateUserProfileFromDal,
    updateUserNotificationSettings as updateUserNotificationSettingsFromDal,
    hasPurchasedItem,
    User,
} from '@eddii-backend/dal';

process.env['USER_TABLE_NAME'] = 'test';
jest.mock('@eddii-backend/dal');

describe('User', () => {
    //getUser API test cases
    describe('Get User', () => {
        const email = 'mailto:test@gmail.com';

        beforeEach(() => {
            (getUserFromDal as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                name: 'Test User',
                ageRange: 'sdfsdf',
            });
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should return a 200 status and user data if user is found', async () => {
            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await getUser(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: 'mailto:test@gmail.com',
                name: 'Test User',
                ageRange: 'sdfsdf',
                eddiiEquippedItems: {
                    eddiiColor: undefined,
                },
                mode: 'child',
            });
        });

        it('should return a 200 status and user data if user is found', async () => {
            (getUserFromDal as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                name: 'Test User',
                ageRange: 'More than 21',
            });
            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await getUser(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: 'mailto:test@gmail.com',
                name: 'Test User',
                ageRange: 'More than 21',
                eddiiEquippedItems: {
                    eddiiColor: undefined,
                },
                mode: 'adult',
            });
        });

        it('should return a 404 status if user is not found', async () => {
            // Mock getUserFromDal to return null for this specific test case.
            (getUserFromDal as jest.Mock).mockResolvedValue(null);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await getUser(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User not found.',
            });
        });
    });

    //equipStoreItemForUserEddii API testcase
    describe('Equip Store Item For User Eddii', () => {
        const email = 'mailto:test@gmail.com';
        const itemArr = [{ name: 'test', slot: 'eddiiShoe' }];
        beforeEach(() => {
            (getUserFromDal as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
            });
            (equipStoreItemForUserFromDal as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                item: itemArr,
            });
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should return a 400 status and validate itemName', async () => {
            // Mock getUserFromDal to return null for this specific test case.
            (equipStoreItemForUserFromDal as jest.Mock).mockResolvedValue(null);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: null, itemSlot: 'eddiiShoe' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await equipStoreItemForUserEddii(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Item name is required.',
            });
        });

        it('should return a 400 status and validate itemSlot', async () => {
            // Mock equipStoreItemForUserFromDal to return null for this specific test case.
            (equipStoreItemForUserFromDal as jest.Mock).mockResolvedValue(null);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: null };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await equipStoreItemForUserEddii(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Item slot is required.',
            });
        });

        it('should return a 404 status if user is not found', async () => {
            // Mock getUserFromDal to return null for this specific test case.
            (getUserFromDal as jest.Mock).mockResolvedValue(null);
            (equipStoreItemForUserFromDal as jest.Mock).mockResolvedValue(null);

            const mockRequest = {
                // userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'eddiiShoe' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await equipStoreItemForUserEddii(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User not found.',
            });
        });

        it('should return a 400 status if item not purchased', async () => {
            // Mock getUserFromDal to return null for this specific test case.
            (equipStoreItemForUserFromDal as jest.Mock).mockResolvedValue(null);
            (hasPurchasedItem as jest.Mock).mockResolvedValue(0);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'eddiiShoe' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await equipStoreItemForUserEddii(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Item not purchased.',
            });
        });

        it('should return a 200 status if item is available', async () => {
            const user = {
                email,
            };
            (getUserFromDal as jest.Mock).mockResolvedValue(user);
            (equipStoreItemForUserFromDal as jest.Mock).mockResolvedValue(
                email,
            );
            (hasPurchasedItem as jest.Mock).mockResolvedValue(1);
            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { itemName: 'test', itemSlot: 'eddiiShoe' };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await equipStoreItemForUserEddii(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                'mailto:test@gmail.com',
            );
        });
    });

    //resetItemsForUserEddii API testcase
    describe('Reset Items For User Eddii', () => {
        const email = 'mailto:test@gmail.com';

        beforeEach(() => {
            (getUserFromDal as jest.Mock).mockResolvedValue({
                email: 'mailto:test@gmail.com',
                name: 'Test User',
            });
            (resetStoreItemsForUser as jest.Mock).mockResolvedValue(null);
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should return a 200 status and reset item for user eddii if user is found', async () => {
            (resetStoreItemsForUser as jest.Mock).mockResolvedValue({
                email,
                name: 'Test User',
            });
            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await resetItemsForUserEddii(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: 'mailto:test@gmail.com',
                name: 'Test User',
            });
        });

        it('should return a 404 status if user is not found', async () => {
            // Mock getUserFromDal to return null for this specific test case.
            (getUserFromDal as jest.Mock).mockResolvedValue(null);

            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await resetItemsForUserEddii(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User not found.',
            });
        });
    });

    //playGame API testcase
    describe('Register device API', () => {
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

        it('Should play Game', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (getUserFromDal as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                hearts: 2,
            });
            (spendHearts as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                hearts: 2,
            });

            await playGame(mockRequest, mockResponse);

            // Expectations

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: mockRequest.userEmail,
                hearts: 2,
            });
        });

        it('Should through 404 when user not found', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (getUserFromDal as jest.Mock).mockResolvedValue(undefined);

            await playGame(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User not found.',
            });
        });

        it('Should through 400 when user do not have enough hearts', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (getUserFromDal as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                hearts: 1,
            });

            await playGame(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Not enough hearts.',
            });
        });

        it('Should through 400 when user do not have enough hearts', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (getUserFromDal as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                hearts: 2,
            });

            (spendHearts as jest.Mock).mockResolvedValue(undefined);

            await playGame(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Not enough hearts.',
            });
        });
    });

    //finishQuiz API testcase
    describe('finish Quiz API', () => {
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

        it('Should play Game', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (getUserFromDal as jest.Mock).mockResolvedValue(
                new User(mockRequest.userEmail),
            );
            (addHeartsForUserFromDal as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
            });

            await finishQuiz(mockRequest, mockResponse);

            // Expectations

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                user: {
                    email: mockRequest.userEmail,
                },
            });
        });
    });

    //updateUserProfile API testcase
    describe('update User Profile API', () => {
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

        it('Should update User Profile', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    nickname: 'testing',
                    locale: '',
                    zoneinfo: '',
                    ageRange: '',
                    diabetesInfo: '',
                },
            };
            (updateUserProfileFromDal as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
            });

            await updateUserProfile(mockRequest, mockResponse);

            // Expectations

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: mockRequest.userEmail,
            });
        });

        it('Should through 400 when whole body is empty', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    nickname: '',
                    locale: '',
                    zoneinfo: '',
                    ageRange: '',
                    diabetesInfo: '',
                },
            };
            (getUserFromDal as jest.Mock).mockResolvedValue(undefined);

            await updateUserProfile(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message:
                    'At least one of nickname, locale, zoneinfo, ageRange, birthday, diabetesInfo, phoneNumber, avatar, badges is required.',
            });
        });

        it('Should through 400 when nickname is invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    nickname: '   ',
                    locale: '',
                    zoneinfo: '',
                    ageRange: '',
                    diabetesInfo: '',
                },
            };
            (getUserFromDal as jest.Mock).mockResolvedValue(undefined);

            await updateUserProfile(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid nickname.',
            });
        });

        it('Should through 400 when locale is invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    nickname: '',
                    locale: 'Invalid',
                    zoneinfo: '',
                    ageRange: '',
                    diabetesInfo: '',
                },
            };
            (getUserFromDal as jest.Mock).mockResolvedValue(undefined);

            await updateUserProfile(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid locale.',
            });
        });

        it('Should through 400 when zoneinfo is invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    nickname: '',
                    locale: '',
                    zoneinfo: 'Invalid',
                    ageRange: '',
                    diabetesInfo: '',
                },
            };
            (getUserFromDal as jest.Mock).mockResolvedValue(undefined);

            await updateUserProfile(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid zoneinfo.',
            });
        });

        it('Should through 400 when ageRange is invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    nickname: '',
                    locale: '',
                    zoneinfo: '',
                    ageRange: '  ',
                    diabetesInfo: '',
                },
            };
            (getUserFromDal as jest.Mock).mockResolvedValue(undefined);

            await updateUserProfile(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid ageRange.',
            });
        });

        it('Should through 400 when diabetesInfo is invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    nickname: '',
                    locale: '',
                    zoneinfo: '',
                    ageRange: '',
                    diabetesInfo: '   ',
                },
            };
            (getUserFromDal as jest.Mock).mockResolvedValue(undefined);

            await updateUserProfile(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid diabetesInfo.',
            });
        });
    });

    //updateUserNotificationSettings API testcase
    describe('update User Notification Settings API', () => {
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

        it('Should update User Notification Settings', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    glucoseAlerts: true,
                    dailyAlerts: false,
                },
            };
            (
                updateUserNotificationSettingsFromDal as jest.Mock
            ).mockResolvedValue({
                email: mockRequest.userEmail,
            });

            await updateUserNotificationSettings(mockRequest, mockResponse);

            // Expectations

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: mockRequest.userEmail,
            });
        });

        it('Should through 400 when required data is empty', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    glucoseAlerts: undefined,
                    dailyAlerts: undefined,
                },
            };

            await updateUserNotificationSettings(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message:
                    'At least one of glucoseAlerts, dailyAlerts is required.',
            });
        });

        it('Should through 400 when glucoseAlerts is invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    glucoseAlerts: 'Invalid',
                    dailyAlerts: undefined,
                },
            };

            await updateUserNotificationSettings(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid glucoseAlerts value.',
            });
        });

        it('Should through 400 when dailyAlerts is invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    glucoseAlerts: undefined,
                    dailyAlerts: 'Invalid',
                },
            };

            await updateUserNotificationSettings(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid dailyAlerts value.',
            });
        });
    });
});
