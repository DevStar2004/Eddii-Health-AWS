import { Request, Response } from 'lambda-api';
import {
    getSession as getSessionFromDal,
    OAuthSession,
    putSession,
    deleteSession as deleteSessionFromDal,
    SessionType,
    Session,
    getSessionCountByUserId,
    listDexcomEgvs,
} from '@eddii-backend/dal';
import {
    getDeviceDataFromDexcom,
    getDexcomSessionFromAuthCode,
    getLatestEgvsDataFromDexcom,
    getRealtimeEgvsDataFromDexcom,
    getStreamingStateFromDexcom,
    refreshAndStoreDexcomSession,
    setStreamingStateFromDexcom,
} from '@eddii-backend/dexcom';
import { getSecret } from '@eddii-backend/secrets';
import { isDexcomDateString, validAlphaNumeric } from '@eddii-backend/utils';
import { EgvsRecord } from '@eddii-backend/types';

const validateRequest = (
    request: Request,
    response: Response,
): { email: string; cgmType: string } => {
    const email = request.userEmail;
    const cgmType = request.params.cgmType;
    if (!cgmType) {
        response.status(400).json({ message: 'CGM Type is required.' });
        return;
    }
    if (cgmType !== 'dexcom') {
        response.status(400).json({ message: `Invalid CGM Type ${cgmType}.` });
        return;
    }
    return { email, cgmType };
};

export const createSession = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const { email, cgmType } = validateRequest(request, response);
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    if (!request.body.authCode && !validAlphaNumeric(request.body.authCode)) {
        response.status(401).json({ message: 'Valid Auth Code is required.' });
        return;
    }

    let session: Session;
    if (cgmType === SessionType.dexcom) {
        const dexcomSecret = await getSecret(process.env['DEXCOM_SECRET']);
        session = await getDexcomSessionFromAuthCode(
            email,
            request.body.authCode,
            dexcomSecret,
        );
        const currentUserIdCount = await getSessionCountByUserId(
            session.userId,
        );
        if (
            (process.env['ENV'] === 'prod' ||
                process.env['ENV'] === 'staging') &&
            currentUserIdCount > 0
        ) {
            console.error(
                `Dexcom account is associated to more than one eddii account: ${session.userId}`,
            );
            response.status(401).json({
                message:
                    'Dexcom account is associated to more than one eddii account.',
            });
            return;
        }
        session = await putSession(session);
        if (process.env['DEXCOM_STREAMING_ENABLED'] === 'true') {
            const streamingState = await getStreamingStateFromDexcom(
                session as OAuthSession,
            );
            if (streamingState?.active === false) {
                await setStreamingStateFromDexcom(
                    true,
                    session as OAuthSession,
                );
            }
        }
    } else {
        response.status(400).json({ message: `Invalid CGM Type ${cgmType}.` });
        return;
    }
    response.status(200).json(session);
};

export const getSession = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const { email, cgmType } = validateRequest(request, response);
    const session = await getSessionFromDal(email, SessionType[cgmType]);
    if (!session) {
        response.status(404).json({ message: 'Session not found.' });
        return;
    }
    response.status(200).json(session);
};

export const deleteSession = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const { email, cgmType } = validateRequest(request, response);
    const session = await getSessionFromDal(email, SessionType[cgmType]);
    if (!session) {
        response.status(404).json({ message: 'Session not found.' });
        return;
    }
    if (process.env['DEXCOM_STREAMING_ENABLED'] === 'true') {
        const count = await getSessionCountByUserId(session.userId);
        // If last session for user then disable streaming
        if (count === 1) {
            try {
                await setStreamingStateFromDexcom(
                    false,
                    session as OAuthSession,
                );
            } catch (e) {
                console.error('Error disabling streaming', e);
            }
        }
    }
    await deleteSessionFromDal(email, SessionType[cgmType]);
    response.status(200).json({ message: 'Session deleted.' });
};

export const refreshSession = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const { email, cgmType } = validateRequest(request, response);
    const cgmTypeEnum = SessionType[cgmType];
    const session = await getSessionFromDal(email, cgmTypeEnum);
    if (!session) {
        response.status(404).json({ message: 'Session not found.' });
        return;
    }
    if (cgmTypeEnum === SessionType.dexcom) {
        const dexcomSecret = await getSecret(process.env['DEXCOM_SECRET']);
        await refreshAndStoreDexcomSession(
            session as OAuthSession,
            dexcomSecret,
        );
    } else {
        response
            .status(400)
            .json({ message: `Invalid Session Type ${cgmType}.` });
        return;
    }
    response.status(200).json({ message: 'Session refreshed.' });
};

export const getCgmDeviceInfo = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const { email, cgmType } = validateRequest(request, response);
    const cgmTypeEnum = SessionType[cgmType];
    const session = await getSessionFromDal(email, cgmTypeEnum);
    if (!session) {
        response.status(404).json({ message: 'Session not found.' });
        return;
    }
    if (cgmTypeEnum === SessionType.dexcom) {
        const device = await getDeviceDataFromDexcom(session as OAuthSession);
        response.status(200).json(device);
    } else {
        response
            .status(400)
            .json({ message: `Invalid Session Type ${cgmType}.` });
        return;
    }
};

export const listEgvs = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const { email, cgmType } = validateRequest(request, response);
    if (!request.query.startTimestamp) {
        response.status(400).json({ message: 'StartTimestamp is required.' });
        return;
    }
    if (!request.query.endTimestamp) {
        response.status(400).json({ message: 'EndTimestamp is required.' });
        return;
    }
    if (!isDexcomDateString(request.query.startTimestamp)) {
        response
            .status(400)
            .json({ message: 'Invalid StartTimestamp time format.' });
        return;
    }
    if (!isDexcomDateString(request.query.endTimestamp)) {
        response
            .status(400)
            .json({ message: 'Invalid EndTimestamp time format.' });
        return;
    }
    const cgmTypeEnum = SessionType[cgmType];
    const session = await getSessionFromDal(email, cgmTypeEnum);
    if (!session) {
        response.status(404).json({ message: 'Session not found.' });
        return;
    }
    if (cgmTypeEnum === SessionType.dexcom) {
        // Get EGVS
        const { startTimestamp, endTimestamp } = request.query;
        const dexcomSession = session as OAuthSession;
        const egvs: EgvsRecord[] = [];
        const results = await listDexcomEgvs(
            dexcomSession.userId,
            startTimestamp,
            endTimestamp,
        );
        if (results?.length > 0 && results[0].length > 0) {
            egvs.push(...results[0]);
        } else {
            const dexcomResults = await getRealtimeEgvsDataFromDexcom(
                startTimestamp,
                endTimestamp,
                dexcomSession,
            );
            if (dexcomResults?.records?.length > 0) {
                egvs.push(...dexcomResults.records);
            }
        }
        response.status(200).json({ records: egvs });
    } else {
        response
            .status(400)
            .json({ message: `Invalid Session Type ${cgmType}.` });
        return;
    }
};

export const getLatestEgv = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const { email, cgmType } = validateRequest(request, response);
    const cgmTypeEnum = SessionType[cgmType];
    const session = await getSessionFromDal(email, cgmTypeEnum);
    if (!session) {
        response.status(404).json({ message: 'Session not found.' });
        return;
    }
    if (cgmTypeEnum === SessionType.dexcom) {
        // Get Latest EGV
        const egv = await getLatestEgvsDataFromDexcom(session as OAuthSession);
        if (egv) {
            response.status(200).json(egv);
        } else {
            response.status(404).json({ message: 'Latest EGV not found.' });
        }
    } else {
        response
            .status(400)
            .json({ message: `Invalid Session Type ${cgmType}.` });
        return;
    }
};
