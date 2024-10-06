import {
    OAuthSession,
    Session,
    SessionType,
    putSession,
} from '@eddii-backend/dal';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import {
    DeviceRecords,
    EgvsRecord,
    EgvsRecords,
    StreamingState,
} from '@eddii-backend/types';
import Clients from '@eddii-backend/clients';

axiosRetry(axios, { retries: 5, retryDelay: axiosRetry.exponentialDelay });

const DEXCOM_V3_API_URL =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? 'https://api.dexcom.com/v3'
        : 'https://sandbox-api.dexcom.com/v3';

const DEXCOM_TOKEN_API_URL =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? 'https://api.dexcom.com/v2/oauth2/token'
        : 'https://sandbox-api.dexcom.com/v2/oauth2/token';

const DEXCOM_CLIENT_ID =
    process.env['ENV'] === 'prod'
        ? 'eeD91IwERDYtcbzUf4QGid9EnsrHb2L1'
        : process.env['ENV'] === 'staging'
          ? '81lLG2TKxuVd8abu2ZY3DeeU2LsO9bmI'
          : 'HbAYfDsZcH6CbUEhpNxmNV1JXY8eD6xc';
const DEXCOM_REDIRECT_URI =
    process.env['ENV'] === 'prod'
        ? 'eddii://oauth/cgm/dexcom'
        : process.env['ENV'] === 'staging'
          ? 'eddii-staging://oauth/cgm/dexcom'
          : 'eddii-sandbox://oauth/cgm/dexcom';

const getDexcomCacheKey = (session: Session) => {
    return `dexcom:${session.userId ? session.userId : session.email}`;
};

export const getRealtimeEgvsDataFromDexcom = async (
    startDate: string,
    endDate: string,
    session: OAuthSession,
): Promise<EgvsRecords> => {
    const redisClient = await Clients.getDexcomCache();
    const cacheKey = `egvsData:${getDexcomCacheKey(
        session,
    )}:${startDate}:${endDate}`;
    let cachedData = undefined;

    try {
        cachedData = await redisClient.get(cacheKey);
    } catch (err) {
        console.error('Cant GET from cache.', err);
    }

    if (cachedData) {
        return JSON.parse(cachedData) as EgvsRecords;
    }

    const response = await axios.get(
        `${DEXCOM_V3_API_URL}/users/self/realtime/egvs?startDate=${startDate}&endDate=${endDate}`,
        {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
        },
    );

    const egvsData = response.data as EgvsRecords;

    const cacheDuration = new Date(endDate) > new Date() ? 300 : 28800;
    try {
        await redisClient.set(cacheKey, JSON.stringify(egvsData), {
            EX: cacheDuration,
        });
    } catch (err) {
        console.error('Cant SET back to cache.', err);
    }

    return egvsData;
};

export const updateLatestEgvsDataFromDexcom = async (
    egv: EgvsRecord,
    userId: string,
): Promise<void> => {
    const redisClient = await Clients.getDexcomCache();
    const cacheKey = `latestEgvsData:dexcom:${userId}`;
    let cachedData = undefined;
    try {
        cachedData = await redisClient.get(cacheKey);
    } catch (err) {
        console.error('Cant GET from cache.', err);
    }
    if (cachedData) {
        const record = JSON.parse(cachedData) as EgvsRecord;
        if (record.systemTime < egv.systemTime) {
            try {
                await redisClient.set(cacheKey, JSON.stringify(egv), {
                    EX: 300,
                });
            } catch (err) {
                console.error('Cant SET back to cache.', err);
            }
        }
    }
};

export const getLatestEgvsDataFromDexcom = async (
    session: OAuthSession,
): Promise<EgvsRecord | undefined> => {
    const redisClient = await Clients.getDexcomCache();
    const cacheKey = `latestEgvsData:${getDexcomCacheKey(session)}`;
    let cachedData = undefined;
    try {
        cachedData = await redisClient.get(cacheKey);
    } catch (err) {
        console.error('Cant GET from cache.', err);
    }
    if (cachedData) {
        return JSON.parse(cachedData) as EgvsRecord;
    }

    const now = new Date();
    now.setSeconds(0, 0); // Set seconds and milliseconds to 0 to get the closest minute
    const startTimestamp = new Date(now.getTime() - 10 * 60 * 1000)
        .toISOString()
        .split('.')[0];
    const endTimestamp = new Date(now.getTime() + 5 * 60 * 1000)
        .toISOString()
        .split('.')[0];
    const egvs = await getRealtimeEgvsDataFromDexcom(
        startTimestamp,
        endTimestamp,
        session,
    );

    if (egvs?.records && egvs.records.length > 0) {
        const latestEgvs = egvs.records[0];
        try {
            await redisClient.set(cacheKey, JSON.stringify(latestEgvs), {
                EX: 300,
            });
        } catch (err) {
            console.error('Cant SET back to cache.', err);
        }
        return latestEgvs;
    } else {
        return undefined;
    }
};

export const getDeviceDataFromDexcom = async (
    session: OAuthSession,
): Promise<DeviceRecords> => {
    const redisClient = await Clients.getDexcomCache();
    const cacheKey = `deviceData:${getDexcomCacheKey(session)}`;
    let cachedData = undefined;
    try {
        cachedData = await redisClient.get(cacheKey);
    } catch (err) {
        console.error('Cant GET from cache.', err);
    }

    if (cachedData) {
        return JSON.parse(cachedData) as DeviceRecords;
    }

    const response = await axios.get(
        `${DEXCOM_V3_API_URL}/users/self/devices`,
        {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
        },
    );

    const deviceData = response.data as DeviceRecords;
    try {
        await redisClient.set(cacheKey, JSON.stringify(deviceData), {
            EX: 28800,
        });
    } catch (err) {
        console.error('Cant SET back to cache.', err);
    }

    return deviceData;
};

export const getStreamingStateFromDexcom = async (
    session: OAuthSession,
): Promise<StreamingState> => {
    try {
        const response = await axios.get(
            `${DEXCOM_V3_API_URL}/users/self/streaming/state`,
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            },
        );
        return response.data as StreamingState;
    } catch (err: any) {
        if (err.response?.status === 404) {
            return { active: false } as StreamingState;
        }
        console.error('Error getting streaming state.', err);
        throw new Error('Error getting streaming state.');
    }
};

export const setStreamingStateFromDexcom = async (
    streamingState: boolean,
    session: OAuthSession,
): Promise<StreamingState> => {
    const response = await axios.put(
        `${DEXCOM_V3_API_URL}/users/self/streaming/state`,
        { active: streamingState },
        {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
            },
        },
    );
    return response.data as StreamingState;
};

export const getUserIdFromDexcom = async (
    session: OAuthSession,
    dexcomSecret: string,
): Promise<string> => {
    const redisClient = await Clients.getDexcomCache();
    const cacheKey = `userId:${getDexcomCacheKey(session)}`;
    let cachedData = undefined;
    try {
        cachedData = await redisClient.get(cacheKey);
    } catch (err) {
        console.error('Cant GET from cache.', err);
    }

    if (cachedData) {
        return cachedData;
    }

    console.log(`Getting user ID from dexcom for ${session.email}.`);
    const response = await axios.post(
        `${DEXCOM_V3_API_URL}/introspect`,
        new URLSearchParams({
            token: session.accessToken,
        } as Record<string, string>).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(
                    `${DEXCOM_CLIENT_ID}:${dexcomSecret}`,
                ).toString('base64')}`,
            },
        },
    );

    const userId = response.data.sub;
    try {
        await redisClient.set(cacheKey, userId, { EX: 28800 });
    } catch (err) {
        console.error('Cant SET back to cache.', err);
    }

    return userId;
};

export const getDexcomSessionFromAuthCode = async (
    email: string,
    authCode: string,
    dexcomSecret: string,
): Promise<OAuthSession> => {
    const response = await axios.post(
        DEXCOM_TOKEN_API_URL,
        new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: DEXCOM_REDIRECT_URI,
            client_id: DEXCOM_CLIENT_ID,
            client_secret: dexcomSecret,
        } as Record<string, string>).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        },
    );
    const expiresAt = Math.round(Date.now() / 1000) + response.data.expires_in;
    const session: OAuthSession = {
        email: email,
        type: SessionType.dexcom,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: 'Bearer',
        expiresAt: expiresAt,
    };
    const userId = await getUserIdFromDexcom(session, dexcomSecret);
    if (userId) {
        session.userId = userId;
    }
    return session;
};

export const refreshDexcomSession = async (
    session: OAuthSession,
    dexcomSecret: string,
): Promise<OAuthSession> => {
    console.log(`Refreshing dexcom session for ${session.email}.`);
    const response = await axios.post(
        DEXCOM_TOKEN_API_URL,
        new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: session.refreshToken,
            redirect_uri: DEXCOM_REDIRECT_URI,
            client_id: DEXCOM_CLIENT_ID,
            client_secret: dexcomSecret,
        } as Record<string, string>).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        },
    );
    const data = await response.data;
    const expiresAt = Math.round(Date.now() / 1000) + data.expires_in;
    const newSession: OAuthSession = {
        email: session.email,
        // Only include userId key if it exists.
        ...(session.userId && { userId: session.userId }),
        type: SessionType.dexcom,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        expiresAt: expiresAt,
    };
    if (newSession.userId === undefined || newSession.userId === null) {
        const userId = await getUserIdFromDexcom(newSession, dexcomSecret);
        if (userId) {
            newSession.userId = userId;
        }
    }
    try {
        if (process.env['DEXCOM_STREAMING_ENABLED'] === 'true') {
            const streamingState =
                await getStreamingStateFromDexcom(newSession);
            if (streamingState?.active === false) {
                await setStreamingStateFromDexcom(true, newSession);
            }
        }
    } catch (err) {
        // Suppress error as this can be added next time.
        console.error('Cannot Update Streaming State.', err);
    }
    console.log(`Refreshed from dexcom, saving.`);
    return newSession;
};

export const refreshAndStoreDexcomSession = async (
    session: OAuthSession,
    dexcomSecret: string,
): Promise<OAuthSession> => {
    const newSession = await refreshDexcomSession(
        session as OAuthSession,
        dexcomSecret,
    );
    await putSession(newSession);
    return newSession;
};
