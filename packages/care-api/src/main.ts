import createAPI, { Request, Response } from 'lambda-api';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
    CORS_DOMAIN_REGEX,
    validateAndNormalizeEmail,
} from '@eddii-backend/utils';
import {
    createPatient,
    updatePatient,
    getPatient,
    listMedicationsForPatient,
    listAppointmentsForPatient,
    getAppointmentForPatient,
    listProviders,
    getProvider,
    listAvailabilityForProvider,
    createAppointmentForPatient,
    updateAppointmentForPatient,
    cancelAppointmentForPatient,
    listConversationsForPatient,
    getConversationForPatient,
    addChatToConversationForPatient,
    getForm,
    fillOutFormForPatient,
    getInsurancePlans,
    listFormCompletionRequests,
    listDocuments,
    getDocument,
    createDocument,
    deleteDocument,
    listOnboardingForms,
    healthieProxy,
    createPayment,
    listPayments,
    updatePayment,
    deletePayment,
    bulkFillOutFormForPatient,
} from './lib/care';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';
import {
    GuardianRole,
    GuardianStatus,
    getGuardianForUser,
    getUser,
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
            if (
                request.path === `/${userEmail}/patient` &&
                request.method === 'POST'
            ) {
                if (
                    guardian &&
                    (guardian.status === GuardianStatus.pending ||
                        guardian.role === GuardianRole.follower)
                ) {
                    response.status(401).json({ message: 'Not Authorized.' });
                    return;
                } else if (!guardian) {
                    // Special case for creating a patient for a user.
                    const user = await getUser(userEmail);
                    if (user) {
                        response
                            .status(401)
                            .json({ message: 'Not Authorized.' });
                        return;
                    }
                }
            } else {
                if (
                    !guardian ||
                    guardian.status === GuardianStatus.pending ||
                    guardian.role === GuardianRole.follower
                ) {
                    response.status(401).json({ message: 'Not Authorized.' });
                    return;
                }
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

// Patient Route.
api.post('/patient', createPatient);
api.put('/patient', updatePatient);
api.get('/patient', getPatient);
// Guardian Access to Patient Routes.
api.post('/:userEmail/patient', createPatient);
api.put('/:userEmail/patient', updatePatient);
api.get('/:userEmail/patient', getPatient);

// Medication Route.
api.get('/patient/medications', listMedicationsForPatient);
// Guardian Access to Medication Routes.
api.get('/:userEmail/patient/medications', listMedicationsForPatient);

// Chat Route.
api.get('/patient/conversation/:conversationId', getConversationForPatient);
api.put(
    '/patient/conversation/:conversationId',
    addChatToConversationForPatient,
);
api.get('/patient/conversations', listConversationsForPatient);
// Guardian Access to Chat Routes.
api.get(
    '/:userEmail/patient/conversation/:conversationId',
    getConversationForPatient,
);
api.put(
    '/:userEmail/patient/conversation/:conversationId',
    addChatToConversationForPatient,
);
api.get('/:userEmail/patient/conversations', listConversationsForPatient);

// Patient Form Route.
api.get('/patient/form/requests', listFormCompletionRequests);
api.get('/patient/form/onboarding', listOnboardingForms);
api.post('/patient/form/:formSlug', fillOutFormForPatient);
api.post('/patient/bulk-form', bulkFillOutFormForPatient);
// Guardian Access to Patient Form Routes.
api.get('/:userEmail/patient/form/requests', listFormCompletionRequests);
api.get('/:userEmail/patient/form/onboarding', listOnboardingForms);
api.post('/:userEmail/patient/form/:formSlug', fillOutFormForPatient);
api.post('/:userEmail/patient/bulk-form', bulkFillOutFormForPatient);

// Appointments Route.
api.post('/patient/appointment', createAppointmentForPatient);
api.get('/patient/appointment/:appointmentId', getAppointmentForPatient);
api.put('/patient/appointment/:appointmentId', updateAppointmentForPatient);
api.delete('/patient/appointment/:appointmentId', cancelAppointmentForPatient);
api.get('/patient/appointments', listAppointmentsForPatient);
// Guardian Access to Appointments Routes.
api.post('/:userEmail/patient/appointment', createAppointmentForPatient);
api.get(
    '/:userEmail/patient/appointment/:appointmentId',
    getAppointmentForPatient,
);
api.put(
    '/:userEmail/patient/appointment/:appointmentId',
    updateAppointmentForPatient,
);
api.delete(
    '/:userEmail/patient/appointment/:appointmentId',
    cancelAppointmentForPatient,
);
api.get('/:userEmail/patient/appointments', listAppointmentsForPatient);

// Documents Route.
api.post('/patient/document', createDocument);
api.get('/patient/document/:documentId', getDocument);
api.delete('/patient/document/:documentId', deleteDocument);
api.get('/patient/documents', listDocuments);
// Guardian Access to Documents Routes.
api.post('/:userEmail/patient/document', createDocument);
api.get('/:userEmail/patient/document/:documentId', getDocument);
api.delete('/:userEmail/patient/document/:documentId', deleteDocument);
api.get('/:userEmail/patient/documents', listDocuments);

// Payment Route.
api.post('/patient/payment', createPayment);
api.get('/patient/payments', listPayments);
api.put('/patient/payment/:paymentId', updatePayment);
api.delete('/patient/payment/:paymentId', deletePayment);
// Guardian Access to Payment Routes.
api.post('/:userEmail/patient/payment', createPayment);
api.get('/:userEmail/patient/payments', listPayments);
api.put('/:userEmail/patient/payment/:paymentId', updatePayment);
api.delete('/:userEmail/patient/payment/:paymentId', deletePayment);

// Providers Route.
api.get('/providers', listProviders);
api.get('/providers/:providerId', getProvider);
api.get('/providers/:providerId/availability', listAvailabilityForProvider);
// Guardian Access to Appointments Routes.
api.get(
    '/:userEmail/providers/:providerId/availability',
    listAvailabilityForProvider,
);

// Global Form Route.
api.get('/form/:formSlug', getForm);

// Global Insurance Plan Route.
api.get('/insurance-plans', getInsurancePlans);

// Proxy API for Healthie.
api.post('/graphql', healthieProxy);

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
