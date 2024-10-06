import createAPI, { Request, Response } from 'lambda-api';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
    equipStoreItemForUserEddii,
    getUser,
    playGame,
    finishQuiz,
    updateUserProfile,
    updateUserNotificationSettings,
    resetItemsForUserEddii,
    updateUserAlertSettings,
} from './lib/user';
import { putDataEntry, listDataEntries } from './lib/data-entry';
import {
    createSession,
    getSession,
    deleteSession,
    refreshSession,
    getCgmDeviceInfo,
    listEgvs,
    getLatestEgv,
} from './lib/cgm';
import {
    createGuardian,
    deleteGuardian,
    listGuardiansForUser,
    listUsersForGuardian,
    createUserForGuardian,
    deleteUserForGuardian,
} from './lib/guardian';
import { addStreak, getCurrentStreak, listStreaks } from './lib/streak';
import { listDevices, registerDevice, unregisterDevice } from './lib/device';
import { getWeeklyHealthSummary } from './lib/health-summary';
import { sendSupportEmail } from './lib/support';
import {
    completeTaskForDailyMission,
    completeTaskForWeeklyMission,
    generateDailyMission,
    getDailyMissionStatus,
    getMission,
    getWeeklyMissionStatus,
    requestWeeklyMission,
} from './lib/mission';
import {
    canCreateSubscription,
    createSubscription,
    getSubscription,
} from './lib/subscription';
import {
    CORS_DOMAIN_REGEX,
    validateAndNormalizeEmail,
} from '@eddii-backend/utils';
import { getDailyNotifications } from './lib/notification';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';
import {
    GuardianStatus,
    getGuardianForUser,
    isGuardianForUser,
} from '@eddii-backend/dal';

const api = createAPI({
    logger: {
        access: true,
        errorLogging: true,
        stack: true,
        timestamp: () => new Date().toISOString(),
    },
});

// CORS
api.use((req, res, next) => {
    // Return CORS headers
    if (CORS_DOMAIN_REGEX.test(req.headers.origin)) {
        res.cors({
            origin: req.headers.origin,
        });
    }
    next();
});

api.use(async (request: Request, response: Response, next: () => void) => {
    if (request.path === '/deep-ping') {
        next();
        return;
    }
    if (request.headers['app-version']) {
        request.appVersion = request.headers['app-version'];
    }
    if (
        request.requestContext.authorizer &&
        request.requestContext.authorizer.claims &&
        request.requestContext.authorizer.claims.email
    ) {
        const email = request.requestContext.authorizer.claims.email;
        const normalizedEmail = validateAndNormalizeEmail(email);
        if (!normalizedEmail) {
            response.status(401).json({ message: 'Not Authorized.' });
            return;
        }
        const userEmail = validateAndNormalizeEmail(request.params.userEmail);
        if (userEmail) {
            // Guardian Flow
            request.guardianEmail = normalizedEmail;
            const guardian = await getGuardianForUser(
                request.guardianEmail,
                userEmail,
            );
            if (!guardian || guardian.status === GuardianStatus.pending) {
                response.status(401).json({ message: 'Not Authorized.' });
                return;
            }
            request.userEmail = userEmail;
        } else {
            // User Flow
            request.userEmail = normalizedEmail;
        }

        next(); // continue execution
    } else {
        response.status(401).json({ message: 'Not Authorized.' });
    }
});

// User Routes.
api.get('/user', getUser);
api.put('/user/profile', updateUserProfile);
api.put('/user/notification-settings', updateUserNotificationSettings);
api.put('/user/alert-settings', updateUserAlertSettings);
api.put('/user/eddii/:itemSlot/:itemName', equipStoreItemForUserEddii);
api.post('/user/eddii/reset', resetItemsForUserEddii);
// Guardian Access to User Routes.
api.get('/:userEmail/user', getUser);

// CGM Routes.
api.post('/user/cgm/:cgmType', createSession);
api.get('/user/cgm/:cgmType', getSession);
api.delete('/user/cgm/:cgmType', deleteSession);
api.post('/user/cgm/:cgmType/refresh', refreshSession);
api.get('/user/cgm/:cgmType/device', getCgmDeviceInfo);
api.get('/user/cgm/:cgmType/egvs', listEgvs);
api.get('/user/cgm/:cgmType/latest-egv', getLatestEgv);
// Guardian Access to CGM Routes.
api.get('/:userEmail/user/cgm/:cgmType', getSession);
api.get('/:userEmail/user/cgm/:cgmType/device', getCgmDeviceInfo);
api.get('/:userEmail/user/cgm/:cgmType/egvs', listEgvs);
api.get('/:userEmail/user/cgm/:cgmType/latest-egv', getLatestEgv);

// Guardian Routes.
// Backwards compatibility for old API. (Moved to Guardian)
api.post('/user/guardian/:email', createGuardian);
api.get('/user/guardian', listUsersForGuardian);
api.delete('/user/guardian/:email', deleteGuardian);
api.post('/user/my-guardian/:email', createUserForGuardian);
api.get('/user/my-guardian', listGuardiansForUser);
api.delete('/user/my-guardian/:email', deleteUserForGuardian);
////////

// Device Routes.
api.post('/user/device', registerDevice);
api.get('/user/device', listDevices);
api.delete('/user/device', unregisterDevice);

// Notification Routes.
api.get('/user/notification/daily', getDailyNotifications);

// Health Summary Routes.
api.get('/user/health-summary/weekly', getWeeklyHealthSummary);
// Guardian Access to Health Summary Routes.
api.get('/:userEmail/user/health-summary/weekly', getWeeklyHealthSummary);

// Data Entry Routes.
api.get('/user/data-entry', listDataEntries);
api.post('/user/data-entry/:dataEntryType', putDataEntry);
// Guardian Access to Data Entry Routes.
api.get('/:userEmail/user/data-entry', listDataEntries);

// Streak Routes.
api.post('/user/streak', addStreak);
api.get('/user/streak', listStreaks);
api.get('/user/current-streak', getCurrentStreak);

// Game Routes.
// Backwards compatibility for old API.
api.post('/user/game', playGame);

// Quiz Routes.
api.post('/user/quiz', finishQuiz);

// Support Routes
api.post('/user/support', sendSupportEmail);

// Mission Routes
api.post('/user/mission/daily', generateDailyMission);
api.get('/user/mission/daily', getDailyMissionStatus);
api.post('/user/mission/daily/:taskType', completeTaskForDailyMission);
api.post('/user/mission/weekly/request', requestWeeklyMission);
api.get('/user/mission/weekly', getWeeklyMissionStatus);
api.post('/user/mission/weekly/:from', completeTaskForWeeklyMission);
api.get('/user/mission', getMission);
// Guardian Access to Mission Routes.
api.get('/:userEmail/user/mission/daily', getDailyMissionStatus);
api.get('/:userEmail/user/mission/weekly', getWeeklyMissionStatus);

// Subscription Routes
api.get('/user/subscription', getSubscription);
api.post('/user/subscription/check', canCreateSubscription);
api.post('/user/subscription', createSubscription);

// Ping Route.
api.get('/deep-ping', async () => {
    return { message: 'ping' };
});

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context,
) => {
    return await api.run(event, context);
};
