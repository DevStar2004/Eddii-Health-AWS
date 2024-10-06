import createAPI from 'lambda-api';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { cohortWebhook } from './lib/webhook';
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

// Authorization Routes.
api.post('/cohort', cohortWebhook);

// Ping Route.
api.get('/deep-ping', async () => {
    return { message: 'mixpanel ping' };
});

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context,
) => {
    return await api.run(event, context);
};
