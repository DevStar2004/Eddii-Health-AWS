/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    createSession,
    getSession as cgmGetSession,
    deleteSession,
    refreshSession,
    listEgvs,
    getLatestEgv,
    getCgmDeviceInfo,
} from './cgm';
import { getSecret } from '@eddii-backend/secrets';
import {
    refreshAndStoreDexcomSession,
    getRealtimeEgvsDataFromDexcom,
    getDeviceDataFromDexcom,
    getDexcomSessionFromAuthCode,
    getStreamingStateFromDexcom,
    setStreamingStateFromDexcom,
    getLatestEgvsDataFromDexcom,
} from '@eddii-backend/dexcom';
import {
    putSession,
    getSession as getSessionFromDal,
    deleteSession as deleteSessionFromDal,
    getSessionCountByUserId,
    listDexcomEgvs,
} from '@eddii-backend/dal';

jest.mock('@eddii-backend/secrets');
jest.mock('@eddii-backend/dexcom');
jest.mock('@eddii-backend/dal');
process.env['DEXCOM_SECRET'] = 'test-secret';

describe('Cgm', () => {
    //Create Session Test cases
    describe('Create Session', () => {
        const email = 'test@gmail.com';
        const authCode = 'validAuthCode';
        const session = { accessToken: 'testToken' };
        const dexcomSecret = {
            clientId: 'testClientId',
            clientSecret: 'testClientSecret',
        };
        beforeEach(() => {
            (getSecret as jest.Mock).mockResolvedValue(dexcomSecret);
            (getSessionFromDal as jest.Mock).mockResolvedValue(session);
        });
        afterEach(() => {
            jest.resetAllMocks();
        });
        it('should throw an required authCode validation error', async () => {
            const mockRequest = {
                email: email,
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object

            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                // authCode: authCode,
            };
            // Send the mockRequest and mockResponse to createSession
            await createSession(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });

        it('should not create a session for multiple user id', async () => {
            const mockRequest = {
                email: email,
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object
            process.env['ENV'] = 'prod';

            (getDexcomSessionFromAuthCode as jest.Mock).mockResolvedValue({
                userId: 'testUserId',
            });
            (getSessionCountByUserId as jest.Mock).mockResolvedValue(2);

            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                authCode: authCode,
            };
            // Send the mockRequest and mockResponse to createSession
            await createSession(mockRequest, mockResponse);
            expect(getDexcomSessionFromAuthCode).toHaveBeenCalledTimes(1);
            expect(putSession).toHaveBeenCalledTimes(0);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            process.env['ENV'] = '';
        });

        it('should create a session for valid input push', async () => {
            const mockRequest = {
                email: email,
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object
            process.env['DEXCOM_STREAMING_ENABLED'] = 'true';

            (getDexcomSessionFromAuthCode as jest.Mock).mockResolvedValue({
                userId: 'testUserId',
            });
            (getStreamingStateFromDexcom as jest.Mock).mockResolvedValue({
                active: true,
            });
            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                authCode: authCode,
            };
            // Send the mockRequest and mockResponse to createSession
            await createSession(mockRequest, mockResponse);
            expect(getDexcomSessionFromAuthCode).toHaveBeenCalledTimes(1);
            expect(putSession).toHaveBeenCalledTimes(1);
            expect(getStreamingStateFromDexcom).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should create a session for valid input push and enable stream', async () => {
            const mockRequest = {
                email: email,
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object
            process.env['DEXCOM_STREAMING_ENABLED'] = 'true';

            (getDexcomSessionFromAuthCode as jest.Mock).mockResolvedValue({
                userId: 'testUserId',
            });
            (getStreamingStateFromDexcom as jest.Mock).mockResolvedValue({
                active: false,
            });
            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                authCode: authCode,
            };
            // Send the mockRequest and mockResponse to createSession
            await createSession(mockRequest, mockResponse);
            expect(getDexcomSessionFromAuthCode).toHaveBeenCalledTimes(1);
            expect(putSession).toHaveBeenCalledTimes(1);
            expect(getStreamingStateFromDexcom).toHaveBeenCalled();
            expect(setStreamingStateFromDexcom).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });

    //Get Session test cases
    describe('Get Session', () => {
        const email = 'test@gmail.com';
        const session = { accessToken: 'testToken' };
        beforeEach(() => {
            (getSessionFromDal as jest.Mock).mockResolvedValue(session);
        });
        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should get session for valid input', async () => {
            const mockRequest = {
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object

            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                authCode: 'validAuthCode',
            };
            // const expectedArgs = [email, 'dexcom'];
            await cgmGetSession(mockRequest, mockResponse);
            expect(getSessionFromDal).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });

    //Delete Sessio test cases
    describe('Delete Session', () => {
        const email = 'test@gmail.com';
        const session = { accessToken: 'testToken' };
        beforeEach(() => {
            (getSessionFromDal as jest.Mock).mockResolvedValue(session);
            (deleteSessionFromDal as jest.Mock).mockResolvedValue(session);
        });
        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should delete session for valid input', async () => {
            process.env['DEXCOM_STREAMING_ENABLED'] = '';
            const mockRequest = {
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object

            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                authCode: 'validAuthCode',
            };
            await deleteSession(mockRequest, mockResponse);
            expect(getSessionCountByUserId).toHaveBeenCalledTimes(0);
            expect(getSessionFromDal).toHaveBeenCalledTimes(1);
            expect(deleteSessionFromDal).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should delete session for valid input and disable stream if last', async () => {
            process.env['DEXCOM_STREAMING_ENABLED'] = 'true';
            const mockRequest = {
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object
            (getSessionCountByUserId as jest.Mock).mockResolvedValue(1);

            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                authCode: 'validAuthCode',
            };
            await deleteSession(mockRequest, mockResponse);
            expect(getSessionFromDal).toHaveBeenCalledTimes(1);
            expect(getSessionCountByUserId).toHaveBeenCalledTimes(1);
            expect(deleteSessionFromDal).toHaveBeenCalledTimes(1);
            expect(setStreamingStateFromDexcom).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should delete session for valid input and not disable stream if more', async () => {
            process.env['DEXCOM_STREAMING_ENABLED'] = 'true';
            const mockRequest = {
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object
            (getSessionCountByUserId as jest.Mock).mockResolvedValue(2);

            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                authCode: 'validAuthCode',
            };
            await deleteSession(mockRequest, mockResponse);
            expect(getSessionCountByUserId).toHaveBeenCalledTimes(1);
            expect(getSessionFromDal).toHaveBeenCalledTimes(1);
            expect(deleteSessionFromDal).toHaveBeenCalledTimes(1);
            expect(setStreamingStateFromDexcom).toHaveBeenCalledTimes(0);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });

    //Refresh Session test cases
    describe('Refresh Session', () => {
        const email = 'test@gmail.com';
        const session = { accessToken: 'testToken' };
        const dexcomSecret = {
            clientId: 'testClientId',
            clientSecret: 'testClientSecret',
        };
        const alerts = {};
        beforeEach(() => {
            (getSessionFromDal as jest.Mock).mockResolvedValue(session);
            (getSecret as jest.Mock).mockResolvedValue(dexcomSecret);
            (refreshAndStoreDexcomSession as jest.Mock).mockResolvedValue(
                alerts,
            );
        });
        afterEach(() => {
            jest.resetAllMocks();
        });
        it('should refersh session for valid input', async () => {
            const mockRequest = {
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object

            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                authCode: 'validAuthCode',
            };
            await refreshSession(mockRequest, mockResponse);
            expect(getSessionFromDal).toHaveBeenCalledTimes(1);
            expect(refreshAndStoreDexcomSession).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });

    //List EGVS test cases
    describe('List EGVS', () => {
        const email = 'test@gmail.com';
        const session = { accessToken: 'testToken', userId: 'testUserId' };
        const dexcomSecret = {
            clientId: 'testClientId',
            clientSecret: 'testClientSecret',
        };
        const alerts = {};
        beforeEach(() => {
            (getSessionFromDal as jest.Mock).mockResolvedValue(session);
            (getSecret as jest.Mock).mockResolvedValue(dexcomSecret);
            (listDexcomEgvs as jest.Mock).mockResolvedValue([
                [alerts],
                undefined,
            ]);
            (getRealtimeEgvsDataFromDexcom as jest.Mock).mockResolvedValue(
                alerts,
            );
        });
        afterEach(() => {
            jest.resetAllMocks();
        });
        it('should list egvs throw an required input', async () => {
            const mockRequest = {
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object

            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.query = {
                startTimestamp: '',
                endTimestamp: '',
            };
            await listEgvs(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should list egvs throw an invalid date timestamp', async () => {
            const mockRequest = {
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object

            // You can set any properties you need on the mockRequest object
            const startTimestamp = '2023-09-14T12:30:00Z';
            const endTimestamp = '2023-09-16T13:30:00Z';
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.query = {
                startTimestamp: startTimestamp,
                endTimestamp: endTimestamp,
            };
            await listEgvs(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should list egvs valid input', async () => {
            const startTimestamp = '2023-09-14T03:43:32';
            const endTimestamp = '2023-09-14T12:00:00';
            const mockRequest = {
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object

            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                authCode: 'validAuthCode',
            };
            mockRequest.query = {
                startTimestamp: startTimestamp,
                endTimestamp: endTimestamp,
            };
            await listEgvs(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(getSessionFromDal).toHaveBeenCalledTimes(1);
            expect(listDexcomEgvs).toHaveBeenCalledTimes(1);
            expect(getRealtimeEgvsDataFromDexcom).toHaveBeenCalledTimes(0);
        });

        it('should list egvs valid input fallback to dexcom', async () => {
            (listDexcomEgvs as jest.Mock).mockResolvedValue([[], undefined]);
            const startTimestamp = '2023-09-14T03:43:32';
            const endTimestamp = '2023-09-14T12:00:00';
            const mockRequest = {
                userEmail: email,
            } as any; // Mock the request object
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any; // Mock the response object

            // You can set any properties you need on the mockRequest object
            mockRequest.params = { cgmType: 'dexcom' };
            mockRequest.body = {
                authCode: 'validAuthCode',
            };
            mockRequest.query = {
                startTimestamp: startTimestamp,
                endTimestamp: endTimestamp,
            };
            await listEgvs(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(getSessionFromDal).toHaveBeenCalledTimes(1);
            expect(listDexcomEgvs).toHaveBeenCalledTimes(1);
            expect(getRealtimeEgvsDataFromDexcom).toHaveBeenCalledTimes(1);
        });
    });

    //Get Latest Egv Session API testcase
    describe('Get Latest Egv session', () => {
        const email = 'test@gmail.com';
        const session = [email, 'dexcom'];
        const dexcomSecret = 'test-secret';
        const record = { value: 300, trend: 'high' };
        beforeEach(() => {
            (getSessionFromDal as jest.Mock).mockResolvedValue(session);
            (getSecret as jest.Mock).mockResolvedValue(dexcomSecret);
            (getLatestEgvsDataFromDexcom as jest.Mock).mockResolvedValue(
                record,
            );
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should return the latest EGV for Dexcom', async () => {
            const mockRequest = {
                userEmail: email,
                params: { cgmType: 'dexcom' },
                body: { authCode: 'validAuthCode' },
            } as any;

            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            const expectedEgv = { value: 300, trend: 'high' };

            await getLatestEgv(mockRequest, mockResponse);

            expect(getSessionFromDal).toHaveBeenCalledTimes(1);
            expect(getLatestEgvsDataFromDexcom).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expectedEgv);
        });
    });

    //Get Cgm Device Info API test case
    describe('Get Cgm Device Info', () => {
        const email = 'mailto:test@gmail.com';
        const session = [email, 'dexcom'];
        const dexcomSecret = 'test-secret';
        beforeEach(() => {
            (getSessionFromDal as jest.Mock).mockResolvedValue(null);
            (getSecret as jest.Mock).mockResolvedValue(null);
            (getDeviceDataFromDexcom as jest.Mock).mockResolvedValue(null);
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should return a 404 status and Session not found', async () => {
            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { cgmType: 'dexcom' };
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await getCgmDeviceInfo(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Session not found.',
            });
        });

        it('should return a 200 status and get device info', async () => {
            (getSessionFromDal as jest.Mock).mockResolvedValue(session);
            (getSecret as jest.Mock).mockResolvedValue(dexcomSecret);
            (getDeviceDataFromDexcom as jest.Mock).mockResolvedValue(session);
            const mockRequest = {
                userEmail: email, // Assuming you are using userEmail here
            } as any;
            mockRequest.params = { cgmType: 'dexcom' };
            const mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            } as any;

            await getCgmDeviceInfo(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith([
                'mailto:test@gmail.com',
                'dexcom',
            ]);
        });
    });
});
