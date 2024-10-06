import { sendAppointmentReminder } from './appointment';
import {
    getPatientByPatientId,
    getUser,
    listGuardiansForUser,
} from '@eddii-backend/dal';
import { getAppointment, getPatient } from '@eddii-backend/healthie';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/healthie');
jest.mock('@eddii-backend/notifications');

describe('sendAppointmentReminder', () => {
    it('should send a reminder to the user and their guardians', async () => {
        const appointmentId = 'appointment123';
        const type = 'twoDays';
        const mockAppointment = {
            provider: { full_name: 'Dr. Smith' },
            date: '2024-04-17 12:10:00 -0400',
            user: { id: 'user123' },
            timezone_abbr: 'EDT',
        };
        const mockPatient = { email: 'patient@example.com' };
        const mockHealthiePatient = { first_name: 'John' };
        const mockUser = {
            email: 'patient@example.com',
            userTopicArn: 'userTopicArn123',
        };
        const mockGuardians = [{ guardianEmail: 'guardian@example.com' }];
        const mockGuardianUser = { userTopicArn: 'guardianTopicArn123' };

        (getAppointment as jest.Mock).mockResolvedValue(mockAppointment);
        (getPatientByPatientId as jest.Mock).mockResolvedValue(mockPatient);
        (getPatient as jest.Mock).mockResolvedValue(mockHealthiePatient);
        (getUser as jest.Mock)
            .mockResolvedValueOnce(mockUser) // For the patient
            .mockResolvedValueOnce(mockGuardianUser); // For the guardian
        (listGuardiansForUser as jest.Mock).mockResolvedValue(mockGuardians);
        (publishPushNotificationToUserTopicArn as jest.Mock).mockResolvedValue(
            {},
        );

        await sendAppointmentReminder(appointmentId, type);

        expect(getAppointment).toHaveBeenCalledWith(appointmentId);
        expect(getPatientByPatientId).toHaveBeenCalledWith(
            mockAppointment.user.id,
        );
        expect(getPatient).toHaveBeenCalledWith(mockAppointment.user.id);
        expect(getUser).toHaveBeenCalledWith(mockPatient.email);
        expect(listGuardiansForUser).toHaveBeenCalledWith(mockUser.email);
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledTimes(2);
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockUser.userTopicArn,
            'Appointment Reminder: 2 days away',
            'You have an appointment with Dr. Smith on Wed, Apr 17, 2024, 12:10 PM EDT.',
            `appointment/${appointmentId}`,
        );
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockGuardianUser.userTopicArn,
            'Appointment Reminder: 2 days away',
            `John has an appointment with Dr. Smith on Wed, Apr 17, 2024, 12:10 PM EDT.`,
            `appointment/${appointmentId}`,
        );
    });

    it('should not send a reminder if the appointment does not exist', async () => {
        const appointmentId = 'nonexistent123';
        const type = 'twoDays';

        (getAppointment as jest.Mock).mockResolvedValue(null);

        await expect(
            sendAppointmentReminder(appointmentId, type),
        ).rejects.toThrow('Appointment not found');

        expect(getAppointment).toHaveBeenCalledWith(appointmentId);
        expect(getPatientByPatientId).not.toHaveBeenCalled();
        expect(getPatient).not.toHaveBeenCalled();
        expect(getUser).not.toHaveBeenCalled();
        expect(listGuardiansForUser).not.toHaveBeenCalled();
        expect(publishPushNotificationToUserTopicArn).not.toHaveBeenCalled();
    });

    it('should not send a reminder if the patient does not exist', async () => {
        const appointmentId = 'appointment123';
        const type = 'twoDays';
        const mockAppointment = {
            provider: { full_name: 'Dr. Smith' },
            date: '2024-04-22 12:10:00 -0400',
            user: { id: 'user123' },
        };

        (getAppointment as jest.Mock).mockResolvedValue(mockAppointment);
        (getPatientByPatientId as jest.Mock).mockResolvedValue(null);

        await expect(
            sendAppointmentReminder(appointmentId, type),
        ).rejects.toThrow('Patient not found');

        expect(getAppointment).toHaveBeenCalledWith(appointmentId);
        expect(getPatientByPatientId).toHaveBeenCalledWith(
            mockAppointment.user.id,
        );
        expect(getPatient).not.toHaveBeenCalled();
        expect(getUser).not.toHaveBeenCalled();
        expect(listGuardiansForUser).not.toHaveBeenCalled();
        expect(publishPushNotificationToUserTopicArn).not.toHaveBeenCalled();
    });

    it('should not send a reminder to user if user does not exist', async () => {
        const appointmentId = 'appointment123';
        const type = 'twoDays';
        const mockAppointment = {
            provider: { full_name: 'Dr. Smith' },
            date: '2024-04-22 12:10:00 -0400',
            user: { id: 'user123' },
        };
        const mockPatient = { email: 'patient@example.com' };

        (getAppointment as jest.Mock).mockResolvedValue(mockAppointment);
        (getPatientByPatientId as jest.Mock).mockResolvedValue(mockPatient);
        (getPatient as jest.Mock).mockResolvedValue({ first_name: 'John' });
        (getUser as jest.Mock).mockResolvedValue(null);

        await sendAppointmentReminder(appointmentId, type);

        expect(getAppointment).toHaveBeenCalledWith(appointmentId);
        expect(getPatientByPatientId).toHaveBeenCalledWith(
            mockAppointment.user.id,
        );
        expect(getPatient).toHaveBeenCalledWith(mockAppointment.user.id);
        expect(getUser).toHaveBeenCalledWith(mockPatient.email);
        expect(listGuardiansForUser).toHaveBeenCalledWith(mockPatient.email);
        expect(publishPushNotificationToUserTopicArn).not.toHaveBeenCalled();
    });
});
