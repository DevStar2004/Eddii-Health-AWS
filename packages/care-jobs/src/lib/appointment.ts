import {
    GuardianRole,
    GuardianStatus,
    getPatientByPatientId,
    getUser,
    listGuardiansForUser,
} from '@eddii-backend/dal';
import { getAppointment, getPatient } from '@eddii-backend/healthie';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';
import { formatAppointmentDate } from '@eddii-backend/utils';

export const sendAppointmentReminder = async (
    appointmentId: string,
    type: string,
) => {
    const appointment = await getAppointment(appointmentId);
    if (!appointment) {
        throw new Error('Appointment not found.');
    }
    const timeToGo =
        type === 'twoDays' ? '2 days' : type === 'oneDay' ? '1 day' : '1 hour';
    const title = `Appointment Reminder: ${timeToGo} away`;
    let message = `You have an appointment with ${appointment.provider.full_name} on ${formatAppointmentDate(appointment.date)} ${appointment.timezone_abbr}.`;
    console.log(
        'Sending appointment reminder for appointmentId:',
        appointmentId,
        type,
    );
    const patient = await getPatientByPatientId(appointment.user.id);
    if (!patient) {
        throw new Error('Patient not found.');
    }
    const healthiePatient = await getPatient(appointment.user.id);
    const user = await getUser(patient.email);
    const guardians = await listGuardiansForUser(patient.email);
    const validGuardians = guardians.filter(
        g =>
            g.role !== GuardianRole.follower &&
            g.status !== GuardianStatus.pending,
    );
    if (user) {
        // Send to user
        await publishPushNotificationToUserTopicArn(
            user.userTopicArn,
            title,
            message,
            `appointment/${appointmentId}`,
        );
    }
    for await (const guardian of validGuardians) {
        if (healthiePatient.first_name) {
            message = message.replace(
                'You have',
                `${healthiePatient.first_name} has`,
            );
        }
        const guardianUser = await getUser(guardian.guardianEmail);
        if (guardianUser) {
            await publishPushNotificationToUserTopicArn(
                guardianUser.userTopicArn,
                title,
                message,
                `appointment/${appointmentId}`,
            );
        }
    }
    console.log('Sent appointment reminder for appointmentId:', appointmentId);
};
