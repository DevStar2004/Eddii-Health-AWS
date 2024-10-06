import { OAuthSession, SessionType } from '@eddii-backend/dal';
import axios from 'axios';
import {
    getDeviceDataFromDexcom,
    getDexcomSessionFromAuthCode,
    getLatestEgvsDataFromDexcom,
    getRealtimeEgvsDataFromDexcom,
    getStreamingStateFromDexcom,
    refreshDexcomSession,
    setStreamingStateFromDexcom,
} from './dexcom';
import { StreamingState } from '@eddii-backend/types';
import Clients from '@eddii-backend/clients';

jest.mock('axios');
jest.mock('@eddii-backend/dal');

describe('getDexcomSessionFromAuthCode', () => {
    const email = 'test@example.com';
    const authCode = 'auth_code';
    const dexcomSecret = 'secret';

    it('should get the dexcom session from an auth code', async () => {
        const response = {
            data: {
                access_token: 'access_token',
                refresh_token: 'refresh_token',
                token_type: 'Bearer',
                expires_in: 3600,
            },
        };
        (axios.post as jest.Mock).mockResolvedValue(response);

        const session = await getDexcomSessionFromAuthCode(
            email,
            authCode,
            dexcomSecret,
        );

        expect(axios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            expect.any(Object),
        );
        expect(session).toEqual({
            email: email,
            type: SessionType.dexcom,
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            tokenType: response.data.token_type,
            expiresAt: expect.any(Number),
        });
    });
});

describe('refreshDexcomSession', () => {
    let session: OAuthSession = {
        email: 'test@example.com',
        type: SessionType.dexcom,
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        tokenType: 'Bearer',
        expiresAt: 0,
    };
    const dexcomSecret = 'secret';

    beforeEach(() => {
        session = {
            email: 'test@example.com',
            type: SessionType.dexcom,
            accessToken: 'access_token',
            refreshToken: 'refresh_token',
            tokenType: 'Bearer',
            expiresAt: 0,
        };
        jest.clearAllMocks();
    });

    it('should refresh the dexcom session', async () => {
        const response = {
            data: {
                access_token: 'new_access_token',
                refresh_token: 'new_refresh_token',
                token_type: 'Bearer',
                expires_in: 3600,
            },
        };

        (axios.post as jest.Mock).mockResolvedValue(response);

        const newSession = await refreshDexcomSession(session, dexcomSecret);

        expect(axios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            expect.any(Object),
        );
        expect(newSession).toEqual({
            email: session.email,
            type: SessionType.dexcom,
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            tokenType: response.data.token_type,
            expiresAt: expect.any(Number),
            ...(newSession.userId && { userId: 'testUserId' }),
        });
    });

    it('should refresh the dexcom session and set user ID', async () => {
        const response = {
            data: {
                access_token: 'new_access_token',
                refresh_token: 'new_refresh_token',
                token_type: 'Bearer',
                expires_in: 3600,
            },
        };
        (axios.post as jest.Mock).mockImplementation(url => {
            if (url.endsWith('/introspect')) {
                return Promise.resolve({ data: { sub: 'testUserId' } });
            }
            return Promise.resolve(response);
        });

        const newSession = await refreshDexcomSession(session, dexcomSecret);

        expect(axios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            expect.any(Object),
        );
        expect(newSession).toEqual({
            email: session.email,
            type: SessionType.dexcom,
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            tokenType: response.data.token_type,
            expiresAt: expect.any(Number),
            userId: 'testUserId',
        });
    });

    it('should refresh the dexcom session and skip userID if already set', async () => {
        const response = {
            data: {
                access_token: 'new_access_token',
                refresh_token: 'new_refresh_token',
                token_type: 'Bearer',
                expires_in: 3600,
            },
        };
        session.userId = 'testUserId';
        (axios.post as jest.Mock).mockImplementation(url => {
            if (url.endsWith('/introspect')) {
                return Promise.resolve({
                    data: { sub: 'testDifferentUserId' },
                });
            }
            return Promise.resolve(response);
        });

        const newSession = await refreshDexcomSession(session, dexcomSecret);

        expect(axios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            expect.any(Object),
        );
        expect(newSession).toEqual({
            email: session.email,
            type: SessionType.dexcom,
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            tokenType: response.data.token_type,
            expiresAt: expect.any(Number),
            userId: 'testUserId',
        });
    });
});

it('should get egvs data from Dexcom API', async () => {
    const session = {
        email: 'test@example.com',
        type: 'dexcom',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        tokenType: 'Bearer',
        expiresAt: Date.now() / 1000 + 3600,
    };

    const mockData = {
        recordType: 'EGV',
        recordVersion: '1.0',
        userId: 'test@example.com',
        records: [
            {
                recordId: '1',
                systemTime: '2022-01-01T00:00:00Z',
                displayTime: '2022-01-01T00:00:00Z',
                value: 100,
                unit: 'mg/dL',
                trend: 4,
                trendDescription: 'Rising Rapidly',
                transmitterGeneration: 'G6',
                transmitterId: '123456',
            },
        ],
    };

    let axiosGetCalled = false;

    (axios.get as jest.Mock).mockImplementation(() => {
        axiosGetCalled = true;
        return Promise.resolve({ data: mockData });
    });

    const egvsData = await getRealtimeEgvsDataFromDexcom(
        '2022-01-01T00:00:00Z',
        '2022-01-02T00:00:00Z',
        session as OAuthSession,
    );

    if (axiosGetCalled) {
        expect(axios.get).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
        );
    }

    expect(egvsData).toEqual(mockData);
});

it('should get device data from Dexcom API', async () => {
    const session = {
        email: 'test@example.com',
        type: 'dexcom',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        tokenType: 'Bearer',
        expiresAt: Date.now() / 1000 + 3600,
    };

    const mockData = {
        recordType: 'DeviceEvent',
        recordVersion: '1.0',
        userId: 'test@example.com',
        records: [
            {
                recordId: '1',
                systemTime: '2022-01-01T00:00:00Z',
                displayTime: '2022-01-01T00:00:00Z',
                eventType: 'Insertion Complete',
                eventSubType: 'Insertion Complete',
                eventValue: '',
                eventUnit: '',
                eventSystemTime: '2022-01-01T00:00:00Z',
                eventDisplayTime: '2022-01-01T00:00:00Z',
                eventStatus: 'OK',
                transmitterGeneration: 'G6',
                transmitterId: '123456',
            },
        ],
    };

    let axiosGetCalled = false;

    (axios.get as jest.Mock).mockImplementation(() => {
        axiosGetCalled = true;
        return Promise.resolve({ data: mockData });
    });

    const deviceData = await getDeviceDataFromDexcom(session as OAuthSession);

    if (axiosGetCalled) {
        expect(axios.get).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
        );
    }

    expect(deviceData).toEqual(mockData);
});

describe('getStreamingStateFromDexcom', () => {
    it('should retrieve streaming state as StreamingState', async () => {
        const mockSession = {
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            tokenType: 'Bearer',
            expiresAt: Date.now() / 1000 + 3600,
        };
        const mockStreamingState: StreamingState = {
            active: false,
            userId: 'test@example.com',
            createdAt: '2022-01-01T00:00:00Z',
            updatedAt: '2022-01-01T00:00:00Z',
        };
        (axios.get as jest.Mock).mockResolvedValue({
            data: mockStreamingState,
        });

        const result = await getStreamingStateFromDexcom(
            mockSession as OAuthSession,
        );

        expect(axios.get).toHaveBeenCalledWith(
            'https://sandbox-api.dexcom.com/v3/users/self/streaming/state',
            {
                headers: {
                    Authorization: `Bearer ${mockSession.accessToken}`,
                },
            },
        );
        expect(result).toEqual(mockStreamingState);
    });
});

describe('setStreamingStateFromDexcom', () => {
    it('should set the streaming state and return the updated state', async () => {
        const mockSession = {
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            tokenType: 'Bearer',
            expiresAt: Date.now() / 1000 + 3600,
        };
        const mockStreamingState: StreamingState = {
            active: true,
            userId: 'test@example.com',
            createdAt: '2022-01-01T00:00:00Z',
            updatedAt: '2022-01-01T00:00:00Z',
        };
        (axios.put as jest.Mock).mockResolvedValue({
            data: mockStreamingState,
        });

        const result = await setStreamingStateFromDexcom(
            true,
            mockSession as OAuthSession,
        );

        expect(axios.put).toHaveBeenCalledWith(
            'https://sandbox-api.dexcom.com/v3/users/self/streaming/state',
            { active: true },
            {
                headers: {
                    Authorization: `Bearer ${mockSession.accessToken}`,
                    'Content-Type': 'application/json',
                },
            },
        );
        expect(result).toEqual(mockStreamingState);
    });
});

describe('getLatestEgvsDataFromDexcom', () => {
    it('should retrieve the latest EGV data from cache if available', async () => {
        const mockSession = {
            email: 'test@example.com',
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            tokenType: 'Bearer',
            expiresAt: Date.now() / 1000 + 3600,
        };
        const mockEgvsRecord: any = {
            recordId: '1',
            systemTime: '2022-01-01T00:00:00Z',
            displayTime: '2022-01-01T00:00:00Z',
            value: 100,
            unit: 'mg/dL',
            trend: 4,
            trendDescription: 'Rising Rapidly',
            transmitterGeneration: 'G6',
            transmitterId: '123456',
        };
        const cacheKey = `latestEgvsData:dexcom:${mockSession.email}`;
        const redisClient = await Clients.getDexcomCache();
        (redisClient.get as jest.Mock).mockResolvedValue(
            JSON.stringify(mockEgvsRecord),
        );

        const result = await getLatestEgvsDataFromDexcom(
            mockSession as OAuthSession,
        );

        expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
        expect(result).toEqual(mockEgvsRecord);
    });
});
