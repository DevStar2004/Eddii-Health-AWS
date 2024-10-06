import createAPI from 'lambda-api';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
    canSignUp,
    canSignUpAsGuardian,
    canSignUpAsUser,
    canSignUpVirtualCare,
    getAppVersion,
} from './lib/authz';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';
import { CORS_DOMAIN_REGEX } from '@eddii-backend/utils';

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

// Authorization Routes.
api.get('/authz/sign-up', canSignUp);
api.get('/authz/care/sign-up', canSignUpVirtualCare);
api.get('/authz/sign-up/guardian/:email', canSignUpAsGuardian);
api.get('/authz/sign-up/user/:email', canSignUpAsUser);
api.get('/authz/:device/app-version', getAppVersion);

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
