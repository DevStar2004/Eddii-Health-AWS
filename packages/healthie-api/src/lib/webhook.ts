import { Request, Response } from 'lambda-api';
import {
    DEFAULT_EDDII_ID,
    SUPPORTED_PROVIDER_IDS,
    getAppointment,
    getConversation,
    getNote,
    getPatient,
} from '@eddii-backend/healthie';
import Clients from '@eddii-backend/clients';
import {
    CreateScheduleCommand,
    CreateScheduleInput,
    DeleteScheduleCommand,
    DeleteScheduleInput,
    Target,
} from '@aws-sdk/client-scheduler';
import {
    GuardianRole,
    GuardianStatus,
    getPatientByPatientId,
    getUser,
    listGuardiansForUser,
} from '@eddii-backend/dal';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';
import {
    sendAppointmentCompletedEmail,
    sendAppointmentCreationEmail,
    sendAppointmentDeleteEmail,
    sendAppointmentUpdateEmail,
    sendPatientCreationEmail,
} from '@eddii-backend/email';

interface HealthieWebhookPayload {
    resource_id: string | number;
    resource_id_type: string;
    event_type: string;
}

const twoDaysInMilliseconds = 2 * 24 * 60 * 60 * 1000; // 2 days
const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // 1 day
const oneHourInMilliseconds = 60 * 60 * 1000; // 1 hour
const twoDays = 'twoDays';
const oneDay = 'oneDay';
const oneHour = 'oneHour';

const createSchedulerForAppointment = async (
    appointmentId: string,
    date: Date,
    type: string,
) => {
    // Create a scheduler for the given time
    const target: Target = {
        RoleArn: process.env.CARE_JOBS_LAMBDA_ROLE_ARN,
        Arn: process.env.CARE_JOBS_LAMBDA_ARN,
        Input: JSON.stringify({
            job: 'AppointmentReminder',
            appointmentId,
            type: type,
        }),
    };

    const name = `appointment-reminder-${appointmentId}-${type}`;
    const schedulerInput: CreateScheduleInput = {
        Name: name,
        FlexibleTimeWindow: {
            Mode: 'OFF',
        },
        ActionAfterCompletion: 'DELETE',
        Target: target,
        ScheduleExpression: `at(${date.toISOString().slice(0, -5)})`,
        ClientToken: name,
    };

    await Clients.scheduler.send(new CreateScheduleCommand(schedulerInput));
};

const createSchedulerForOnboarding = async (
    patientId: string,
    date: Date,
    attempt: number,
) => {
    // Create a scheduler for the given time
    const target: Target = {
        RoleArn: process.env.CARE_JOBS_LAMBDA_ROLE_ARN,
        Arn: process.env.CARE_JOBS_LAMBDA_ARN,
        Input: JSON.stringify({
            job: 'OnboardingReminder',
            patientId,
        }),
    };

    const name = `onboarding-reminder-${patientId}-${attempt}`;
    const schedulerInput: CreateScheduleInput = {
        Name: name,
        FlexibleTimeWindow: {
            Mode: 'OFF',
        },
        ActionAfterCompletion: 'DELETE',
        Target: target,
        ScheduleExpression: `at(${date.toISOString().slice(0, -5)})`,
        ClientToken: name,
    };

    await Clients.scheduler.send(new CreateScheduleCommand(schedulerInput));
};

const deleteSchedulerForAppointment = async (
    appointmentId: string,
    type: string,
) => {
    const name = `appointment-reminder-${appointmentId}-${type}`;
    const schedulerInput: DeleteScheduleInput = {
        Name: name,
        ClientToken: name,
    };

    await Clients.scheduler.send(new DeleteScheduleCommand(schedulerInput));
};

const createAllSchedulersForAppointment = async (appointment: any) => {
    const appointmentDate = new Date(appointment.date);
    const currentTime = new Date();

    // Check if the appointment is more than 2 days away
    if (
        appointmentDate.getTime() - currentTime.getTime() >
        twoDaysInMilliseconds
    ) {
        await createSchedulerForAppointment(
            appointment.id,
            new Date(appointmentDate.getTime() - twoDaysInMilliseconds),
            twoDays,
        );
    }

    // Check if the appointment is more than 1 day away
    if (
        appointmentDate.getTime() - currentTime.getTime() >
        oneDayInMilliseconds
    ) {
        await createSchedulerForAppointment(
            appointment.id,
            new Date(appointmentDate.getTime() - oneDayInMilliseconds),
            oneDay,
        );
    }

    // Check if the appointment is 1 hour away
    if (
        appointmentDate.getTime() - currentTime.getTime() >
        oneHourInMilliseconds
    ) {
        await createSchedulerForAppointment(
            appointment.id,
            new Date(appointmentDate.getTime() - oneHourInMilliseconds),
            oneHour,
        );
    }
};

const deleteAllSchedulersForAppointment = async (appointmentId: string) => {
    try {
        await deleteSchedulerForAppointment(appointmentId, twoDays);
    } catch (err) {
        if (err?.name !== 'ResourceNotFoundException') {
            console.error('Failed to delete scheduler for appointment:', err);
            throw err;
        }
    }
    try {
        await deleteSchedulerForAppointment(appointmentId, oneDay);
    } catch (err) {
        if (err.name !== 'ResourceNotFoundException') {
            console.error('Failed to delete scheduler for appointment:', err);
            throw err;
        }
    }
    try {
        await deleteSchedulerForAppointment(appointmentId, oneHour);
    } catch (err) {
        if (err.name !== 'ResourceNotFoundException') {
            console.error('Failed to delete scheduler for appointment:', err);
            throw err;
        }
    }
};

export const createAppointmentWebhook = async (
    request: Request,
    response: Response,
) => {
    const payload: HealthieWebhookPayload = request.body;
    console.log('Appointment Webhook Payload:', payload);
    if (payload.event_type !== 'appointment.created') {
        response.status(400).send({ message: 'Invalid event type' });
        return;
    }
    if (payload.resource_id_type !== 'Appointment') {
        response.status(400).send({ message: 'Invalid resource type' });
        return;
    }
    if (!payload.resource_id) {
        response.status(400).send({ message: 'Invalid resource ID' });
        return;
    }
    const appointmentId = payload.resource_id.toString();
    const appointment = await getAppointment(appointmentId);
    if (!appointment) {
        console.error('Appointment not found:', payload.resource_id);
        response.status(404).send({ message: 'Appointment not found' });
        return;
    }
    const patient = await getPatientByPatientId(appointment.user.id);
    if (!patient) {
        console.error('Patient not found:', appointment.user.id);
        response.status(200).send({ message: 'success' });
        return;
    }

    try {
        await createAllSchedulersForAppointment(appointment);
    } catch (err) {
        console.error('Failed to create schedulers for appointment:', err);
        response.status(500).send({ message: 'Internal Server Error' });
        return;
    }
    try {
        const healthiePatient = await getPatient(appointment.user.id);
        if (!healthiePatient) {
            console.error('Healthie Patient not found:', appointment.user.id);
            throw new Error('Healthie Patient not found');
        }
        const guardians = await listGuardiansForUser(patient.email);
        const validGuardians = guardians.filter(
            g =>
                g.role !== GuardianRole.follower &&
                g.status !== GuardianStatus.pending,
        );
        await sendAppointmentCreationEmail(
            [patient.email, ...validGuardians.map(g => g.guardianEmail)],
            healthiePatient.first_name,
            appointment.provider.full_name,
            appointment.appointment_type.name,
            appointment.date,
            appointment.timezone_abbr,
            appointment.zoom_join_url,
        );
    } catch (err) {
        console.error('Failed to send appointment creation email:', err);
        response.status(500).send({ message: 'Internal Server Error' });
        return;
    }
    response.status(200).send({ message: 'success' });
    return;
};

export const updateAppointmentWebhook = async (
    request: Request,
    response: Response,
) => {
    const payload: HealthieWebhookPayload = request.body;
    console.log('Appointment Webhook Payload:', payload);
    if (payload.event_type !== 'appointment.updated') {
        response.status(400).send({ message: 'Invalid event type' });
        return;
    }
    if (payload.resource_id_type !== 'Appointment') {
        response.status(400).send({ message: 'Invalid resource type' });
        return;
    }
    if (!payload.resource_id) {
        response.status(400).send({ message: 'Invalid resource ID' });
        return;
    }
    const appointmentId = payload.resource_id.toString();
    const appointment = await getAppointment(appointmentId);
    if (!appointment) {
        console.error('Appointment not found:', payload.resource_id);
        response.status(404).send({ message: 'Appointment not found' });
        return;
    }
    const patient = await getPatientByPatientId(appointment.user.id);
    if (!patient) {
        console.error('Patient not found:', appointment.user.id);
        response.status(200).send({ message: 'success' });
        return;
    }
    if (appointment.pm_status === 'Cancelled') {
        try {
            await deleteAllSchedulersForAppointment(appointmentId);
        } catch (err) {
            console.error('Failed to delete schedulers for appointment:', err);
            response.status(500).send({ message: 'Internal Server Error' });
            return;
        }
        try {
            const healthiePatient = await getPatient(appointment.user.id);
            if (!healthiePatient) {
                console.error(
                    'Healthie Patient not found:',
                    appointment.user.id,
                );
                throw new Error('Healthie Patient not found');
            }
            const guardians = await listGuardiansForUser(patient.email);
            const validGuardians = guardians.filter(
                g =>
                    g.role !== GuardianRole.follower &&
                    g.status !== GuardianStatus.pending,
            );
            await sendAppointmentDeleteEmail(
                [patient.email, ...validGuardians.map(g => g.guardianEmail)],
                healthiePatient.first_name,
                appointment.provider.full_name,
                appointment.appointment_type.name,
                appointment.date,
                appointment.timezone_abbr,
            );
        } catch (err) {
            console.error('Failed to send appointment delete email:', err);
            response.status(500).send({ message: 'Internal Server Error' });
            return;
        }
    } else if (appointment.pm_status === 'Occurred') {
        try {
            const healthiePatient = await getPatient(appointment.user.id);
            if (!healthiePatient) {
                console.error(
                    'Healthie Patient not found:',
                    appointment.user.id,
                );
                throw new Error('Healthie Patient not found');
            }
            const guardians = await listGuardiansForUser(patient.email);
            const validGuardians = guardians.filter(
                g =>
                    g.role !== GuardianRole.follower &&
                    g.status !== GuardianStatus.pending,
            );
            await sendAppointmentCompletedEmail(
                [patient.email, ...validGuardians.map(g => g.guardianEmail)],
                healthiePatient.first_name,
                appointment.provider.full_name,
                appointment.appointment_type.name,
                appointment.date,
                appointment.timezone_abbr,
            );
        } catch (err) {
            console.error('Failed to send appointment occured email:', err);
            response.status(500).send({ message: 'Internal Server Error' });
            return;
        }
    } else {
        try {
            await deleteAllSchedulersForAppointment(appointmentId);
            await createAllSchedulersForAppointment(appointment);
        } catch (err) {
            console.error('Failed to update schedulers for appointment:', err);
            response.status(500).send({ message: 'Internal Server Error' });
            return;
        }
        try {
            const healthiePatient = await getPatient(appointment.user.id);
            if (!healthiePatient) {
                console.error(
                    'Healthie Patient not found:',
                    appointment.user.id,
                );
                throw new Error('Healthie Patient not found');
            }
            const guardians = await listGuardiansForUser(patient.email);
            const validGuardians = guardians.filter(
                g =>
                    g.role !== GuardianRole.follower &&
                    g.status !== GuardianStatus.pending,
            );
            await sendAppointmentUpdateEmail(
                [patient.email, ...validGuardians.map(g => g.guardianEmail)],
                healthiePatient.first_name,
                appointment.provider.full_name,
                appointment.appointment_type.name,
                appointment.date,
                appointment.timezone_abbr,
                appointment.zoom_join_url,
            );
        } catch (err) {
            console.error('Failed to send appointment update email:', err);
            response.status(500).send({ message: 'Internal Server Error' });
            return;
        }
    }
    response.status(200).send({ message: 'success' });
    return;
};

export const deleteAppointmentWebhook = async (
    request: Request,
    response: Response,
) => {
    const payload: HealthieWebhookPayload = request.body;
    console.log('Appointment Webhook Payload:', payload);
    if (payload.event_type !== 'appointment.deleted') {
        response.status(400).send({ message: 'Invalid event type' });
        return;
    }
    if (payload.resource_id_type !== 'Appointment') {
        response.status(400).send({ message: 'Invalid resource type' });
        return;
    }
    if (!payload.resource_id) {
        response.status(400).send({ message: 'Invalid resource ID' });
        return;
    }
    const appointmentId = payload.resource_id.toString();
    const appointment = await getAppointment(appointmentId);
    if (!appointment) {
        console.error('Appointment not found:', payload.resource_id);
        response.status(404).send({ message: 'Appointment not found' });
        return;
    }
    const patient = await getPatientByPatientId(appointment.user.id);
    if (!patient) {
        console.error('Patient not found:', appointment.user.id);
        response.status(200).send({ message: 'success' });
        return;
    }
    try {
        await deleteAllSchedulersForAppointment(appointmentId);
    } catch (err) {
        console.error('Failed to delete schedulers for appointment:', err);
        response.status(500).send({ message: 'Internal Server Error' });
        return;
    }
    response.status(200).send({ message: 'success' });
    return;
};

export const createMessageWebhook = async (
    request: Request,
    response: Response,
) => {
    const payload: HealthieWebhookPayload = request.body;
    console.log('Message Webhook Payload:', payload);
    if (payload.event_type !== 'message.created') {
        response.status(400).send({ message: 'Invalid event type' });
        return;
    }
    if (payload.resource_id_type !== 'Note') {
        response.status(400).send({ message: 'Invalid resource type' });
        return;
    }
    if (!payload.resource_id) {
        response.status(400).send({ message: 'Invalid resource ID' });
        return;
    }
    const noteId = payload.resource_id.toString();
    const note = await getNote(noteId);
    if (!note) {
        response.status(404).send({ message: 'Note not found' });
        return;
    }
    if (
        note.creator.id !== DEFAULT_EDDII_ID &&
        !SUPPORTED_PROVIDER_IDS.has(note.creator.id)
    ) {
        // Skip notifications from users to providers.
        response.status(200).send({ message: 'success' });
        return;
    }
    const conversation = await getConversation(note.conversation_id);
    if (!conversation) {
        response.status(404).send({ message: 'Conversation not found' });
        return;
    }
    const title = `New eddii-care message`;
    const message = `You just received a message from ${note.creator.full_name}.`;
    for await (const userId of conversation.invitees.map(i => i.id)) {
        const patient = await getPatientByPatientId(userId);
        if (!patient) {
            console.warn('Patient not found:', userId);
            continue;
        }
        const user = await getUser(patient.email);
        if (user) {
            // Send to user
            await publishPushNotificationToUserTopicArn(
                user.userTopicArn,
                title,
                message,
                `conversation/${conversation.id}`,
            );
        }
        const guardians = await listGuardiansForUser(user.email);
        const validGuardians = guardians.filter(
            g =>
                g.role !== GuardianRole.follower &&
                g.status !== GuardianStatus.pending,
        );
        for await (const guardian of validGuardians) {
            const guardianUser = await getUser(guardian.guardianEmail);
            if (guardianUser) {
                await publishPushNotificationToUserTopicArn(
                    guardianUser.userTopicArn,
                    title,
                    message,
                    `conversation/${conversation.id}`,
                );
            }
        }
    }
    response.status(200).send({ message: 'success' });
    return;
};

export const createPatientWebhook = async (
    request: Request,
    response: Response,
) => {
    const payload: HealthieWebhookPayload = request.body;
    console.log('Patient Webhook Payload:', payload);
    if (payload.event_type !== 'patient.created') {
        response.status(400).send({ message: 'Invalid event type' });
        return;
    }
    if (payload.resource_id_type !== 'User') {
        response.status(400).send({ message: 'Invalid resource type' });
        return;
    }
    if (!payload.resource_id) {
        response.status(400).send({ message: 'Invalid resource ID' });
        return;
    }
    const patientId = payload.resource_id.toString();
    const patient = await getPatientByPatientId(patientId);
    if (!patient) {
        console.error('Healthie Patient not found:', patientId);
        response.status(200).send({ message: 'success' });
        return;
    }
    try {
        const now = new Date();
        await createSchedulerForOnboarding(
            patientId,
            new Date(now.getTime() + oneHourInMilliseconds),
            1,
        );
        await createSchedulerForOnboarding(
            patientId,
            new Date(now.getTime() + oneDayInMilliseconds),
            2,
        );
        await createSchedulerForOnboarding(
            patientId,
            new Date(now.getTime() + twoDaysInMilliseconds),
            3,
        );
    } catch (err) {
        console.error('Failed to create schedulers for onboarding:', err);
        response.status(500).send({ message: 'Internal Server Error' });
        return;
    }
    try {
        const healthiePatient = await getPatient(patientId);
        if (!healthiePatient) {
            console.error('Healthie Patient not found:', payload.resource_id);
            throw new Error('Healthie Patient not found');
        }
        const guardians = await listGuardiansForUser(patient.email);
        const validGuardians = guardians.filter(
            g =>
                g.role !== GuardianRole.follower &&
                g.status !== GuardianStatus.pending,
        );
        await sendPatientCreationEmail(
            [patient.email, ...validGuardians.map(g => g.guardianEmail)],
            healthiePatient.first_name,
        );
    } catch (err) {
        console.error('Failed to send patient creation email:', err);
        response.status(500).send({ message: 'Internal Server Error' });
        return;
    }
    response.status(200).send({ message: 'success' });
    return;
};
