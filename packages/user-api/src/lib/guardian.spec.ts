import {
    createGuardian,
    deleteGuardian,
    listGuardiansForUser,
    listUsersForGuardian,
} from './guardian';
import {
    getUser,
    listUsersForGuardian as listUsersForGuardianFromDal,
    listGuardiansForUser as listGuardiansForUserFromDal,
    createGuardian as createGuardianViaDal,
    batchGetUserProfiles,
} from '@eddii-backend/dal';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/email');

describe('Guardian Module', () => {
    //createGuardian API testcase
    describe('create Guardian API', () => {
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

        it('Should create Guardian', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    email: 'guardian@gmail.com',
                },
            };
            (getUser as jest.Mock).mockResolvedValue(null);
            (listUsersForGuardianFromDal as jest.Mock).mockResolvedValue([]);
            (listGuardiansForUserFromDal as jest.Mock).mockResolvedValue([]);
            (createGuardianViaDal as jest.Mock).mockResolvedValue({
                guardianEmail: mockRequest.params.email,
                email: mockRequest.userEmail,
            });

            await createGuardian(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                guardianEmail: 'guardian@gmail.com',
                email: 'user@gmail.com',
            });
        });

        it('Should through 400 when guardianEmail is Invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    email: 'Invalid',
                },
            };

            await createGuardian(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Guardian Email is required.',
            });
        });

        it('Should through 400 when guardianEmail same as user', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    email: 'user@gmail.com',
                },
            };

            await createGuardian(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Guardian Email cannot be your own email.',
            });
        });

        // it('should return 400 when an account is already associated with guardian email', async () => {
        //     mockRequest = {
        //         userEmail: 'user@gmail.com',
        //         params: {
        //             email: 'guardian@gmail.com',
        //         },
        //     };

        //     // Mock getUser and listUsersForGuardianFromDal functions to return data
        //     (getUser as jest.Mock).mockResolvedValue({ email: mockRequest.params.email });
        //     (listUsersForGuardianFromDal as jest.Mock).mockResolvedValue({ guardianEmail: mockRequest.params.email });

        //     await createGuardian(mockRequest, mockResponse);

        //     expect(mockResponse.status).toHaveBeenCalledWith(400);
        //     expect(mockResponse.json).toHaveBeenCalledWith({ message: 'An account is already associated with this email.' });
        // });

        it('should return 400 when a guardian is already associated with the user', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    email: 'guardian@gmail.com',
                },
            };

            (listUsersForGuardianFromDal as jest.Mock).mockResolvedValue([
                { userEmail: mockRequest.userEmail },
            ]);

            await createGuardian(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'This guardian is already associated with this user.',
            });
        });
    });

    //listUsersForGuardian API testcase
    describe('list Users For Guardian API', () => {
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

        it('Should return Users For Guardian', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (batchGetUserProfiles as jest.Mock).mockResolvedValue([
                {
                    email: mockRequest.userEmail,
                    nickname: 'test',
                },
                {
                    email: 'guardian@gmail.com',
                    nickname: 'testG',
                },
            ]);
            (listUsersForGuardianFromDal as jest.Mock).mockResolvedValue([
                {
                    guardianEmail: 'guardian@gmail.com',
                    userEmail: mockRequest.userEmail,
                },
            ]);

            await listUsersForGuardian(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith([
                {
                    userProfile: {
                        email: 'user@gmail.com',
                        nickname: 'test',
                    },
                    userEmail: 'user@gmail.com',
                    guardianEmail: 'guardian@gmail.com',
                    guardianProfile: {
                        email: 'guardian@gmail.com',
                        nickname: 'testG',
                    },
                },
            ]);
        });
    });

    //listGuardiansForUser API testcase
    describe('list Guardians For User API', () => {
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

        it('Should return Guardians For User', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };
            (batchGetUserProfiles as jest.Mock).mockResolvedValue([
                {
                    email: mockRequest.userEmail,
                    nickname: 'test',
                },
                {
                    email: 'guardian@gmail.com',
                    nickname: 'testG',
                },
            ]);
            (listGuardiansForUserFromDal as jest.Mock).mockResolvedValue([
                {
                    guardianEmail: 'guardian@gmail.com',
                    userEmail: mockRequest.userEmail,
                },
            ]);

            await listGuardiansForUser(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith([
                {
                    userProfile: {
                        email: 'user@gmail.com',
                        nickname: 'test',
                    },
                    userEmail: 'user@gmail.com',
                    guardianEmail: 'guardian@gmail.com',
                    guardianProfile: {
                        email: 'guardian@gmail.com',
                        nickname: 'testG',
                    },
                },
            ]);
        });
    });

    //deleteGuardian API testcase
    describe('delete Guardian API', () => {
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

        it('Should return 400 when Guardian email is empty', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    email: null,
                },
            };

            await deleteGuardian(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Guardian Email is required.',
            });
        });

        it('Should return 400 when Guardian email and user email are same', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    email: 'user@gmail.com',
                },
            };

            await deleteGuardian(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Guardian Email cannot be your own email.',
            });
        });

        it('Should return 200 when guardian deleted', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                params: {
                    email: 'guardian@gmail.com',
                },
            };

            await deleteGuardian(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Guardian deleted.',
            });
        });
    });
});
