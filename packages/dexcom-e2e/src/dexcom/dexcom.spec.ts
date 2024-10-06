import axios from 'axios';
import { SessionType } from '@eddii-backend/dal';
import {
    getDeviceDataFromDexcom,
    getDexcomSessionFromAuthCode,
    getRealtimeEgvsDataFromDexcom,
    getStreamingStateFromDexcom,
    getUserIdFromDexcom,
    refreshDexcomSession,
} from '@eddii-backend/dexcom';

const DEXCOM_CLIENT_ID = 'HbAYfDsZcH6CbUEhpNxmNV1JXY8eD6xc';
const DEXCOM_REDIRECT_URI = 'eddii://oauth/cgm/dexcom';

describe('Dexcom G6', () => {
    jest.retryTimes(3);

    it('should create dexcom session', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser6',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        expect(session.accessToken).toBeDefined();
        expect(session.refreshToken).toBeDefined();
        expect(session.expiresAt).toBeDefined();
        expect(session.email).toBeDefined();
    });

    it('should refresh dexcom session', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser6',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        const refreshSession = await refreshDexcomSession(
            {
                email: 'test@mail.com',
                type: SessionType.dexcom,
                accessToken: session.accessToken,
                refreshToken: session.refreshToken,
                tokenType: 'Bearer',
                expiresAt: Math.round(Date.now() / 1000),
            },
            process.env.DEXCOM_SECRET,
        );
        expect(session.accessToken).toBeDefined();
        expect(session.refreshToken).toBeDefined();
        expect(session.expiresAt).toBeDefined();
        expect(session.email).toBeDefined();
        expect(refreshSession.email).toBe(session.email);
    });

    it('should get egvs data', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser6',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        const data = await getRealtimeEgvsDataFromDexcom(
            new Date(new Date().getTime() - 6 * 60 * 1000)
                .toISOString()
                .split('.')[0],
            new Date().toISOString().split('.')[0],
            session,
        );
        expect(data.records.length).toBe(1);
    });

    it('should get device data', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser6',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        const data = await getDeviceDataFromDexcom(session);
        expect(
            data.records[0].alertSchedules[0].alertSettings.find(
                alert => alert.alertName === 'high',
            ),
        ).toBeDefined();
    }, 10000);

    it('should get user ID', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser6',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        const userId = await getUserIdFromDexcom(
            session,
            process.env.DEXCOM_SECRET,
        );
        expect(userId).toBe(
            '2c1728f6fc155fc0752e0b56d30414624ced69ae6cd04bc41c9d1b2683489101',
        );
    }, 10000);

    it('should get streaming state', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser6',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        const data = await getStreamingStateFromDexcom(session);
        expect(data.active).toBeTruthy();
    }, 10000);
});

describe('Dexcom G7', () => {
    jest.retryTimes(3);

    it('should create dexcom session', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser7',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        expect(session.accessToken).toBeDefined();
        expect(session.refreshToken).toBeDefined();
        expect(session.expiresAt).toBeDefined();
        expect(session.email).toBeDefined();
    });

    it('should refresh dexcom session', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser7',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        const refreshSession = await refreshDexcomSession(
            {
                email: 'test@mail.com',
                type: SessionType.dexcom,
                accessToken: session.accessToken,
                refreshToken: session.refreshToken,
                tokenType: 'Bearer',
                expiresAt: Math.round(Date.now() / 1000),
            },
            process.env.DEXCOM_SECRET,
        );
        expect(session.accessToken).toBeDefined();
        expect(session.refreshToken).toBeDefined();
        expect(session.expiresAt).toBeDefined();
        expect(session.email).toBeDefined();
        expect(refreshSession.email).toBe(session.email);
    });

    it('should get egvs data', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser7',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        const data = await getRealtimeEgvsDataFromDexcom(
            new Date(new Date().getTime() - 6 * 60 * 1000)
                .toISOString()
                .split('.')[0],
            new Date().toISOString().split('.')[0],
            session,
        );
        expect(data.records.length).toBe(1);
    }, 10000);

    it('should get device data', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser7',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        const data = await getDeviceDataFromDexcom(session);
        expect(
            data.records[0].alertSchedules[0].alertSettings.find(
                alert => alert.alertName === 'high',
            ),
        ).toBeDefined();
    }, 10000);

    it('should get user ID', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser7',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        const userId = await getUserIdFromDexcom(
            session,
            process.env.DEXCOM_SECRET,
        );
        expect(userId).toBe(
            '8c92397d63456e493151ffc035333929d5325140702c8b5d6731084f9b8acfea',
        );
    }, 10000);

    it('should get streaming state', async () => {
        const response = await axios.post(
            'https://developer-portal-prod-us-dot-g5-dexcom-prod-us-5.appspot.com/consent',
            {
                userId: 'SandboxUser7',
                clientId: DEXCOM_CLIENT_ID,
                redirectURI: DEXCOM_REDIRECT_URI,
                state: '',
                scope: [
                    'egv',
                    'calibrations',
                    'devices',
                    'dataRange',
                    'events',
                    'statistics',
                ],
            },
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
            },
        );
        const session = await getDexcomSessionFromAuthCode(
            'test@mail.com',
            response.data.authCode,
            process.env.DEXCOM_SECRET,
        );
        const data = await getStreamingStateFromDexcom(session);
        expect(data.active).toBeTruthy();
    }, 10000);
});
