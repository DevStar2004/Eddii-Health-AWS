/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    canSignUpAsGuardian,
    canSignUp,
    canSignUpAsUser,
    getAppVersion,
    canSignUpVirtualCare,
} from './authz';
import { listUsersForGuardian } from '@eddii-backend/dal';
import { getProvider } from '@eddii-backend/healthie';
import { getLocation } from '@eddii-backend/utils';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/utils');
jest.mock('@eddii-backend/healthie');
jest.mock('@eddii-backend/utils', () => ({
    ...jest.requireActual('@eddii-backend/utils'),
    getLocation: jest.fn(),
}));

describe('Authz', () => {
    //canSignUpAsGuardian API test cases
    describe('Can Signup As Guardian API', () => {
        const email = 'test@gmail.com';
        beforeEach(() => {
            (listUsersForGuardian as jest.Mock).mockResolvedValue(email);
        });

        afterEach(() => {
            jest.resetAllMocks();
        });
        it('should return a 400 status if guardianEmail not found', async () => {
            (listUsersForGuardian as jest.Mock).mockResolvedValue(null);
            const mockRequest = {} as any;
            mockRequest.params = { email: null };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await canSignUpAsGuardian(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Guardian Email is required.',
            });
        });

        it('should return a 200 status if user signup as a guardian', async () => {
            const mockRequest = {} as any;
            mockRequest.params = { email: email };

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await canSignUpAsGuardian(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                canSignUp: true,
            });
        });
    });

    //canSignUp API testcase
    describe('Can Signup', () => {
        let mockRequest = {} as any;
        let mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as any;

        beforeEach(() => {
            process.env['ENV'] = 'prod';
            mockRequest = {
                requestContext: {
                    identity: {
                        sourceIp: '74.125.45.100',
                    },
                },
            };
            mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
            };
        });
        afterEach(() => {
            jest.resetAllMocks();
        });

        it('allows sign-up when IP is in the allow list', async () => {
            (getLocation as jest.Mock).mockResolvedValue({
                countryCode: 'US',
                region: 'OK',
            });
            await canSignUp(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ canSignUp: true });
        });

        it('disallows sign-up when IP is not in the allow list', async () => {
            (getLocation as jest.Mock).mockResolvedValue({
                countryCode: 'IN',
                region: 'DL',
            });

            await canSignUp(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                canSignUp: false,
            });
        });

        it('when source IP is null', async () => {
            // Set sourceIp to null
            mockRequest.requestContext = { identity: { sourceIp: null } };

            await canSignUp(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ canSignUp: true });
        });

        it('handles environment "ENV" being neither "prod" nor "staging"', async () => {
            process.env['ENV'] = 'dev';

            await canSignUp(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ canSignUp: true });
        });
    });

    //canSignUp API testcase
    describe('Can Signup Care', () => {
        let mockRequest = {} as any;
        let mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as any;

        beforeEach(() => {
            process.env['ENV'] = 'prod';
            mockRequest = {
                requestContext: {
                    identity: {
                        sourceIp: '74.125.45.100',
                    },
                },
            };
            mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
            };

            (getProvider as jest.Mock).mockResolvedValue({
                state_licenses: [{ state: 'OK' }],
            });
        });
        afterEach(() => {
            jest.resetAllMocks();
        });

        it('allows sign-up when IP is in the allow list', async () => {
            (getLocation as jest.Mock).mockResolvedValue({
                countryCode: 'US',
                region: 'OK',
            });
            await canSignUpVirtualCare(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ canSignUp: true });
        });

        it('disallows sign-up when IP is not in the allow list', async () => {
            (getLocation as jest.Mock).mockResolvedValue({
                countryCode: 'US',
                region: 'DL',
            });

            await canSignUpVirtualCare(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                canSignUp: false,
            });
        });

        it('disallows sign-up when IP is not in the allow list', async () => {
            (getLocation as jest.Mock).mockResolvedValue({
                countryCode: 'IN',
                region: 'DL',
            });

            await canSignUpVirtualCare(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                canSignUp: false,
            });
        });

        it('when source IP is null', async () => {
            // Set sourceIp to null
            mockRequest.requestContext = { identity: { sourceIp: null } };

            await canSignUpVirtualCare(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ canSignUp: true });
        });

        it('handles environment "ENV" being neither "prod" nor "staging"', async () => {
            process.env['ENV'] = 'dev';

            await canSignUpVirtualCare(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ canSignUp: true });
        });
    });

    //canSignUpAsUser API Test cases
    describe('Can Signup As User', () => {
        let mockRequest = {} as any;
        let mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as any;

        beforeEach(() => {
            mockRequest = {
                params: {
                    email: 'test@example.com',
                },
            };
            mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
            };
        });
        afterEach(() => {
            jest.resetAllMocks();
        });

        it('disallows sign-up when email is not in the allow list', async () => {
            await canSignUpAsUser(
                {
                    ...mockRequest,
                    params: {
                        email: 'test2@example.com',
                    },
                },
                mockResponse,
            );

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                canSignUp: false,
            });
        });

        it('throw 400 when email is invalid or null', async () => {
            mockRequest.params.email = null;

            await canSignUpAsUser(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid User Email is required.',
            });
        });
    });

    //getAppVersion API Test cases
    describe('Get app version', () => {
        const mockRequest = {} as any;
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

        it('throw 400 when device is empty', async () => {
            mockRequest.params = { device: null };
            await getAppVersion(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid device is required.',
            });
        });

        it('throw 400 when device is invalid', async () => {
            mockRequest.params = { device: 'Invalid' };
            await getAppVersion(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid device is required.',
            });
        });

        it('should return app version for ios', async () => {
            mockRequest.params = { device: 'ios' };
            await getAppVersion(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                buildVersion: 1,
                startUpdateOn: '2023-08-25T00:00:00Z',
                forceUpdateOn: '2023-09-01T00:00:00Z',
                showReviewPrompt: true,
                showUpdatePrompt: true,
            });
        });

        it('should return app version for android', async () => {
            mockRequest.params = { device: 'android' };
            await getAppVersion(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                buildVersion: 1,
                startUpdateOn: '2023-08-25T00:00:00Z',
                forceUpdateOn: '2023-09-01T00:00:00Z',
                showReviewPrompt: true,
                showUpdatePrompt: true,
            });
        });
    });
});
