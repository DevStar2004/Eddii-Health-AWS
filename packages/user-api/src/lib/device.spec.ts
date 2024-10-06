import {
    doesDeviceExist,
    extendDeviceExpiration,
    registerDevice as registerDeviceInDal,
    listDevices as listDevicesInDal,
    unregisterDevice as unregisterDeviceInDal,
} from '@eddii-backend/dal';
import { listDevices, registerDevice, unregisterDevice } from './device';

jest.mock('@eddii-backend/dal');

describe('Device Module', () => {
    //registerDevice API testcase
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

        it('Should register device', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    deviceToken: 'testToken',
                    deviceType: 'ios',
                },
            };
            (doesDeviceExist as jest.Mock).mockResolvedValue(false);
            (registerDeviceInDal as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                deviceToken: mockRequest.body.deviceToken,
                deviceType: mockRequest.body.deviceType,
            });

            await registerDevice(mockRequest, mockResponse);

            // Expectations

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: 'user@gmail.com',
                deviceToken: 'testToken',
                deviceType: 'ios',
            });
        });
        it('Should extend Device Expiration', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    deviceToken: 'testToken',
                    deviceType: 'ios',
                },
            };
            (doesDeviceExist as jest.Mock).mockResolvedValue(true);
            (extendDeviceExpiration as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                deviceToken: mockRequest.body.deviceToken,
            });

            await registerDevice(mockRequest, mockResponse);

            // Expectations

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: 'user@gmail.com',
                deviceToken: 'testToken',
            });
        });

        it('Should through 400 when deviceToken is Empty', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    deviceToken: null,
                    deviceType: 'ios',
                },
            };

            await registerDevice(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Device Token is required.',
            });
        });

        it('Should through 400 when deviceToken is Invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    deviceToken: '  ',
                    deviceType: 'ios',
                },
            };

            await registerDevice(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Device Token is required.',
            });
        });

        it('Should through 400 when deviceType is Empty', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    deviceToken: 'testToken',
                    deviceType: null,
                },
            };

            await registerDevice(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Device Type is required.',
            });
        });

        it('Should through 400 when deviceType is Invalid', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    deviceToken: 'testToken',
                    deviceType: 'Invalid',
                },
            };

            await registerDevice(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Valid Device Type is required.',
            });
        });
    });

    //listDevices API testcase
    describe('list Devices API', () => {
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

        it('Should list device', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
            };

            (listDevicesInDal as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                deviceToken: 'testToken',
                deviceType: 'ios',
            });

            await listDevices(mockRequest, mockResponse);

            // Expectations

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                email: 'user@gmail.com',
                deviceToken: 'testToken',
                deviceType: 'ios',
            });
        });
    });

    //unregisterDevice API testcase
    describe('unregister Device API', () => {
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

        it('Should register device', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    deviceToken: 'testToken',
                },
            };

            (unregisterDeviceInDal as jest.Mock).mockResolvedValue({});

            await unregisterDevice(mockRequest, mockResponse);

            // Expectations

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Device unregistered.',
            });
        });

        it('Should return 400 if token is null', async () => {
            mockRequest = {
                userEmail: 'user@gmail.com',
                body: {
                    deviceToken: null,
                },
            };

            await unregisterDevice(mockRequest, mockResponse);

            // Expectations

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Device Token is required.',
            });
        });
    });
});
