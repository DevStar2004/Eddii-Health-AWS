// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';
import { sendAppointmentReminder } from './lib/appointment';
import { sendOnboardingReminder } from './lib/patient';

exports.handler = async input => {
    if (input.job === 'AppointmentReminder') {
        await sendAppointmentReminder(input.appointmentId, input.type);
    } else if (input.job === 'OnboardingReminder') {
        await sendOnboardingReminder(input.patientId);
    } else {
        throw new Error('Unsupported event type.');
    }
};
