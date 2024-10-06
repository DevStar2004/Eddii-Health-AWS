import createAPI from 'lambda-api';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';
import {
    createAppointmentWebhook,
    deleteAppointmentWebhook,
    updateAppointmentWebhook,
    createMessageWebhook,
    createPatientWebhook,
} from './lib/webhook';

const api = createAPI({
    logger: {
        access: true,
        errorLogging: true,
        stack: true,
        timestamp: () => new Date().toISOString(),
    },
});

// Appointment Webhook Route.
api.post('/appointment/created', createAppointmentWebhook);
api.post('/appointment/updated', updateAppointmentWebhook);
api.post('/appointment/deleted', deleteAppointmentWebhook);

// Message Webhook Route.
api.post('/message/created', createMessageWebhook);

// Patient Webhook Route.
api.post('/patient/created', createPatientWebhook);

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
