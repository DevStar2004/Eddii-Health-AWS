import createAPI, { Request, Response } from 'lambda-api';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
    GuardianStatus,
    getGuardianForUser,
    isGuardianForUser,
} from '@eddii-backend/dal';
import { setWeeklyMission } from './lib/mission';
import {
    CORS_DOMAIN_REGEX,
    validateAndNormalizeEmail,
} from '@eddii-backend/utils';
import {
    acceptFollower,
    createFollower,
    deleteFollower,
    deleteFollowing,
    listFollowers,
    listFollowing,
    requestToFollow,
    updateGuardianNotificationSettings,
} from './lib/guardian';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';

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
    const userEmail = validateAndNormalizeEmail(request.params.userEmail);
    if (
        request.requestContext.authorizer &&
        request.requestContext.authorizer.claims &&
        request.requestContext.authorizer.claims.email
    ) {
        const email = request.requestContext.authorizer.claims.email;
        const normalizedGuardianEmail = validateAndNormalizeEmail(email);
        if (!normalizedGuardianEmail) {
            response.status(401).json({ message: 'Not Authorized.' });
            return;
        }
        request.guardianEmail = normalizedGuardianEmail;
        if (userEmail) {
            // Guardian Flow
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
            request.userEmail = normalizedGuardianEmail;
        }
        next(); // continue execution
    } else {
        response.status(401).json({ message: 'Not Authorized.' });
    }
});

// Guardian Routes.
api.post('/follower/:followerEmail', createFollower);
api.put('/follower/:followerEmail/accept', acceptFollower);
api.get('/followers', listFollowers);
api.delete('/follower/:followerEmail', deleteFollower);
api.post('/following/:followingEmail', requestToFollow);
api.get('/following', listFollowing);
api.delete('/following/:followingEmail', deleteFollowing);
// Alerts Routes.
api.put(
    '/guardian/:userEmail/alert-settings',
    updateGuardianNotificationSettings,
);
// Mission Routes.
api.post('/:userEmail/mission/weekly/set', setWeeklyMission);

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
