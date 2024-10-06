import {
    createAppointmentWebhook,
    updateAppointmentWebhook,
    deleteAppointmentWebhook,
    createMessageWebhook,
    createPatientWebhook,
} from './webhook';
import { Request, Response } from 'lambda-api';
import {
    getAppointment,
    getConversation,
    getNote,
    getPatient,
} from '@eddii-backend/healthie';
import Clients from '@eddii-backend/clients';
import {
    CreateScheduleCommand,
    DeleteScheduleCommand,
} from '@aws-sdk/client-scheduler';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';
import {
    getPatientByPatientId,
    getUser,
    listGuardiansForUser,
} from '@eddii-backend/dal';
import {
    sendAppointmentCompletedEmail,
    sendAppointmentCreationEmail,
    sendAppointmentDeleteEmail,
    sendAppointmentUpdateEmail,
    sendPatientCreationEmail,
} from '@eddii-backend/email';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/healthie');
jest.mock('@eddii-backend/notifications');
jest.mock('@eddii-backend/email');

describe('createAppointmentWebhook', () => {
    const mockRequest = {
        body: {
            resource_id: '123',
            resource_id_type: 'Appointment',
            event_type: 'appointment.created',
        },
    } as unknown as Request;
    const mockResponse = {
        status: jest.fn(() => mockResponse),
        send: jest.fn(),
    } as unknown as Response;
    const mockAppointment = {
        id: '123',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        timezone_abbr: 'EDT',
        provider: {
            full_name: 'John Doe',
        },
        appointment_type: {
            name: 'Appointment',
        },
        user: {
            id: 'user123',
        },
        zoom_join_url: 'https://example.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getAppointment as jest.Mock).mockResolvedValue(mockAppointment);
        (getPatientByPatientId as jest.Mock).mockResolvedValue({
            email: 'user@example.com',
        });
        (getUser as jest.Mock).mockResolvedValue({
            email: 'user@example.com',
        });
        (listGuardiansForUser as jest.Mock).mockResolvedValue([
            {
                guardianEmail: 'guardian@example.com',
            },
        ]);
        (getPatient as jest.Mock).mockResolvedValue({
            first_name: 'John',
        });
    });

    it('should create schedulers for appointments more than 2 days away', async () => {
        await createAppointmentWebhook(mockRequest, mockResponse);

        const mockSend = (
            Clients.scheduler.send as jest.Mock
        ).mockResolvedValue({});
        expect(mockSend).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith({ message: 'success' });
    });

    it('should create schedulers for appointments more than 1 day away', async () => {
        await createAppointmentWebhook(mockRequest, mockResponse);

        const mockSend = (
            Clients.scheduler.send as jest.Mock
        ).mockResolvedValue({});
        expect(mockSend).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith({ message: 'success' });
    });

    it('should create schedulers for appointments 1 hour away', async () => {
        await createAppointmentWebhook(mockRequest, mockResponse);

        const mockSend = (
            Clients.scheduler.send as jest.Mock
        ).mockResolvedValue({});
        expect(mockSend).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith({ message: 'success' });
    });

    it('should create send appointment creation email', async () => {
        await createAppointmentWebhook(mockRequest, mockResponse);

        const mockSend = (
            Clients.scheduler.send as jest.Mock
        ).mockResolvedValue({});
        expect(mockSend).toHaveBeenCalled();
        expect(sendAppointmentCreationEmail).toHaveBeenCalledWith(
            ['user@example.com', 'guardian@example.com'],
            'John',
            mockAppointment.provider.full_name,
            mockAppointment.appointment_type.name,
            mockAppointment.date,
            mockAppointment.timezone_abbr,
            mockAppointment.zoom_join_url,
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith({ message: 'success' });
    });

    it('should return an error if event type is invalid', async () => {
        await createAppointmentWebhook(
            {
                ...mockRequest,
                body: { ...mockRequest.body, event_type: 'invalid_event' },
            },
            mockResponse,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid event type',
        });
    });

    it('should return an error if resource type is invalid', async () => {
        await createAppointmentWebhook(
            {
                ...mockRequest,
                body: { ...mockRequest.body, resource_id_type: 'InvalidType' },
            },
            mockResponse,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid resource type',
        });
    });

    it('should return an error if resource ID is missing', async () => {
        await createAppointmentWebhook(
            {
                ...mockRequest,
                body: { ...mockRequest.body, resource_id: undefined },
            },
            mockResponse,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid resource ID',
        });
    });
});

describe('updateAppointmentWebhook', () => {
    const mockRequest = {
        body: {
            resource_id: '123',
            resource_id_type: 'Appointment',
            event_type: 'appointment.updated',
        },
    } as unknown as Request;
    const mockResponse = {
        status: jest.fn(() => mockResponse),
        send: jest.fn(),
    } as unknown as Response;
    const mockAppointment = {
        id: '123',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        timezone_abbr: 'EDT',
        provider: {
            full_name: 'John Doe',
        },
        appointment_type: {
            name: 'Appointment',
        },
        user: {
            id: 'user123',
        },
        zoom_join_url: 'https://example.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getAppointment as jest.Mock).mockResolvedValue(mockAppointment);
        (getPatientByPatientId as jest.Mock).mockResolvedValue({
            email: 'user@example.com',
        });
        (getUser as jest.Mock).mockResolvedValue({
            email: 'user@example.com',
        });
        (listGuardiansForUser as jest.Mock).mockResolvedValue([
            {
                guardianEmail: 'guardian@example.com',
            },
        ]);
        (getPatient as jest.Mock).mockResolvedValue({
            first_name: 'John',
        });
    });

    describe('change appt times', () => {
        it('should update schedulers for appointments more than 2 days away', async () => {
            await updateAppointmentWebhook(mockRequest, mockResponse);

            const mockSend = (
                Clients.scheduler.send as jest.Mock
            ).mockResolvedValue({});
            expect(mockSend).toHaveBeenCalledWith(
                expect.any(CreateScheduleCommand),
            );
            expect(sendAppointmentUpdateEmail).toHaveBeenCalledWith(
                ['user@example.com', 'guardian@example.com'],
                'John',
                mockAppointment.provider.full_name,
                mockAppointment.appointment_type.name,
                mockAppointment.date,
                mockAppointment.timezone_abbr,
                mockAppointment.zoom_join_url,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: 'success',
            });
        });

        it('should delete schedulers for appointments less than 2 days away', async () => {
            const closeAppointment = {
                ...mockAppointment,
                date: new Date(
                    Date.now() + 1 * 24 * 60 * 60 * 1000,
                ).toISOString(), // 1 day from now
            };
            (getAppointment as jest.Mock).mockResolvedValue(closeAppointment);

            await updateAppointmentWebhook(mockRequest, mockResponse);

            const mockSend = (
                Clients.scheduler.send as jest.Mock
            ).mockResolvedValue({});
            expect(mockSend).toHaveBeenCalledWith(
                expect.any(DeleteScheduleCommand),
            );
            expect(sendAppointmentUpdateEmail).toHaveBeenCalledWith(
                ['user@example.com', 'guardian@example.com'],
                'John',
                mockAppointment.provider.full_name,
                mockAppointment.appointment_type.name,
                closeAppointment.date,
                closeAppointment.timezone_abbr,
                mockAppointment.zoom_join_url,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: 'success',
            });
        });
    });

    describe('cancel appt', () => {
        it('should only delete schedulers for cancelled appointments', async () => {
            (getAppointment as jest.Mock).mockResolvedValue({
                ...mockAppointment,
                pm_status: 'Cancelled',
            });
            await updateAppointmentWebhook(mockRequest, mockResponse);

            const mockSend = (
                Clients.scheduler.send as jest.Mock
            ).mockResolvedValue({});
            expect(mockSend).not.toHaveBeenCalledWith(
                expect.any(CreateScheduleCommand),
            );
            expect(mockSend).toHaveBeenCalledWith(
                expect.any(DeleteScheduleCommand),
            );
            expect(sendAppointmentDeleteEmail).toHaveBeenCalledWith(
                ['user@example.com', 'guardian@example.com'],
                'John',
                mockAppointment.provider.full_name,
                mockAppointment.appointment_type.name,
                mockAppointment.date,
                mockAppointment.timezone_abbr,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: 'success',
            });
        });
    });

    describe('complete appt', () => {
        it('should only delete schedulers for cancelled appointments', async () => {
            (getAppointment as jest.Mock).mockResolvedValue({
                ...mockAppointment,
                pm_status: 'Occurred',
            });
            await updateAppointmentWebhook(mockRequest, mockResponse);

            const mockSend = (
                Clients.scheduler.send as jest.Mock
            ).mockResolvedValue({});
            expect(mockSend).not.toHaveBeenCalledWith();
            expect(sendAppointmentCompletedEmail).toHaveBeenCalledWith(
                ['user@example.com', 'guardian@example.com'],
                'John',
                mockAppointment.provider.full_name,
                mockAppointment.appointment_type.name,
                mockAppointment.date,
                mockAppointment.timezone_abbr,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: 'success',
            });
        });
    });

    it('should return an error if event type is invalid', async () => {
        await updateAppointmentWebhook(
            {
                ...mockRequest,
                body: { ...mockRequest.body, event_type: 'invalid_event' },
            },
            mockResponse,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid event type',
        });
    });

    it('should return an error if resource type is invalid', async () => {
        await updateAppointmentWebhook(
            {
                ...mockRequest,
                body: { ...mockRequest.body, resource_id_type: 'InvalidType' },
            },
            mockResponse,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid resource type',
        });
    });

    it('should return an error if resource ID is missing', async () => {
        await updateAppointmentWebhook(
            {
                ...mockRequest,
                body: { ...mockRequest.body, resource_id: undefined },
            },
            mockResponse,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid resource ID',
        });
    });
});

describe('deleteAppointmentWebhook', () => {
    const mockRequest = {
        body: {
            resource_id: '123',
            resource_id_type: 'Appointment',
            event_type: 'appointment.deleted',
        },
    } as unknown as Request;
    const mockResponse = {
        status: jest.fn(() => mockResponse),
        send: jest.fn(),
    } as unknown as Response;
    const mockAppointment = {
        id: '123',
        user: {
            id: 'user123',
        },
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        timezone_abbr: 'EDT',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getAppointment as jest.Mock).mockResolvedValue(mockAppointment);
        (getPatientByPatientId as jest.Mock).mockResolvedValue({
            email: 'user@example.com',
        });
    });

    it('should successfully delete schedulers for an appointment', async () => {
        await deleteAppointmentWebhook(mockRequest, mockResponse);

        const mockSend = (
            Clients.scheduler.send as jest.Mock
        ).mockResolvedValue({});
        expect(mockSend).toHaveBeenCalledTimes(3);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith({ message: 'success' });
    });

    it('should return an error if event type is invalid', async () => {
        const mockRequest = {
            body: {
                event_type: 'invalid_event',
                resource_id_type: 'Appointment',
                resource_id: '123',
            },
        } as unknown as Request;
        await deleteAppointmentWebhook(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid event type',
        });
    });

    it('should return an error if resource type is invalid', async () => {
        const mockRequest = {
            body: {
                event_type: 'appointment.deleted',
                resource_id_type: 'InvalidType',
                resource_id: '123',
            },
        } as unknown as Request;
        await deleteAppointmentWebhook(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid resource type',
        });
    });

    it('should return an error if resource ID is missing', async () => {
        const mockRequest = {
            body: {
                event_type: 'appointment.deleted',
                resource_id_type: 'Appointment',
                resource_id: undefined,
            },
        } as unknown as Request;
        await deleteAppointmentWebhook(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid resource ID',
        });
    });

    it('should handle errors other than ResourceNotFoundException when deleting schedulers', async () => {
        const mockRequest = {
            body: {
                event_type: 'appointment.deleted',
                resource_id_type: 'Appointment',
                resource_id: '123',
            },
        } as unknown as Request;
        const testError = new Error('Test Error');
        testError.name = 'TestError'; // Simulate an error other than ResourceNotFoundException
        (Clients.scheduler.send as jest.Mock).mockRejectedValueOnce(testError);

        await deleteAppointmentWebhook(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Internal Server Error',
        });
    });
});

describe('createMessageWebhook', () => {
    let mockRequest: any;
    let mockResponse: any;
    let mockNote: any;
    let mockConversation: any;
    let mockUser: any;
    let mockGuardian: any;
    let mockGuardians: any;

    beforeEach(() => {
        mockRequest = {
            body: {
                event_type: 'message.created',
                resource_id_type: 'Note',
                resource_id: 'note123',
            },
        };
        mockResponse = {
            status: jest.fn(() => mockResponse),
            send: jest.fn(),
        };
        mockNote = {
            id: 'note123',
            conversation_id: 'conv123',
            creator: {
                id: '986378',
                full_name: 'John Doe',
            },
        };
        mockConversation = {
            id: 'conv123',
            invitees: [{ id: 'user123' }],
        };
        mockUser = {
            email: 'user@example.com',
            userTopicArn: 'arn:aws:sns:example:user123',
        };
        mockGuardian = {
            email: 'guardian@example.com',
            userTopicArn: 'arn:aws:sns:example:guaridan123',
        };
        mockGuardians = [
            {
                guardianEmail: 'guardian@example.com',
            },
        ];
        jest.clearAllMocks();
    });

    it('should send a push notification when a message is created', async () => {
        (getNote as jest.Mock).mockResolvedValueOnce(mockNote);
        (getConversation as jest.Mock).mockResolvedValueOnce(mockConversation);
        (getUser as jest.Mock).mockResolvedValueOnce(mockUser);
        (getUser as jest.Mock).mockResolvedValueOnce(mockGuardian);
        (getPatientByPatientId as jest.Mock).mockResolvedValueOnce({
            email: 'user@example.com',
        });
        (listGuardiansForUser as jest.Mock).mockResolvedValueOnce(
            mockGuardians,
        );

        await createMessageWebhook(
            mockRequest as Request,
            mockResponse as Response,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith({ message: 'success' });
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockUser.userTopicArn,
            'New eddii-care message',
            'You just received a message from John Doe.',
            `conversation/${mockConversation.id}`,
        );
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockGuardian.userTopicArn,
            'New eddii-care message',
            'You just received a message from John Doe.',
            `conversation/${mockConversation.id}`,
        );
    });

    it('should skip push notification when a message is created from non provider', async () => {
        (getNote as jest.Mock).mockResolvedValueOnce({
            ...mockNote,
            creator: { id: 'user123', full_name: 'John Doe' },
        });

        await createMessageWebhook(
            mockRequest as Request,
            mockResponse as Response,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith({ message: 'success' });
        expect(publishPushNotificationToUserTopicArn).not.toHaveBeenCalled();
    });

    it('should return an error if event type is invalid', async () => {
        mockRequest.body.event_type = 'invalid.event';
        await createMessageWebhook(
            mockRequest as Request,
            mockResponse as Response,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid event type',
        });
    });

    it('should return an error if resource type is invalid', async () => {
        mockRequest.body.resource_id_type = 'InvalidType';
        await createMessageWebhook(
            mockRequest as Request,
            mockResponse as Response,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid resource type',
        });
    });

    it('should return an error if resource ID is missing', async () => {
        mockRequest.body.resource_id = undefined;
        await createMessageWebhook(
            mockRequest as Request,
            mockResponse as Response,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid resource ID',
        });
    });

    it('should return an error if note is not found', async () => {
        (getNote as jest.Mock).mockResolvedValueOnce(null);
        await createMessageWebhook(
            mockRequest as Request,
            mockResponse as Response,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Note not found',
        });
    });

    it('should return an error if conversation is not found', async () => {
        (getNote as jest.Mock).mockResolvedValueOnce(mockNote);
        (getConversation as jest.Mock).mockResolvedValueOnce(null);
        await createMessageWebhook(
            mockRequest as Request,
            mockResponse as Response,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Conversation not found',
        });
    });
});

describe('createPatientWebhook', () => {
    let mockRequest = {
        body: {
            resource_id: 'user123',
            resource_id_type: 'User',
            event_type: 'patient.created',
        },
    } as unknown as Request;
    const mockResponse = {
        status: jest.fn(() => mockResponse),
        send: jest.fn(),
    } as unknown as Response;

    beforeEach(() => {
        jest.clearAllMocks();
        (getPatientByPatientId as jest.Mock).mockResolvedValue({
            email: 'user@example.com',
        });
        (getUser as jest.Mock).mockResolvedValue({
            email: 'user@example.com',
        });
        (listGuardiansForUser as jest.Mock).mockResolvedValue([
            {
                guardianEmail: 'guardian@example.com',
            },
        ]);
        (getPatient as jest.Mock).mockResolvedValue({
            first_name: 'John',
        });
        mockRequest = {
            body: {
                resource_id: 'user123',
                resource_id_type: 'User',
                event_type: 'patient.created',
            },
        } as unknown as Request;
    });

    it('should return an error if event type is invalid', async () => {
        mockRequest.body.event_type = 'invalid.event';
        await createPatientWebhook(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid event type',
        });
    });

    it('should return an error if resource type is invalid', async () => {
        mockRequest.body.resource_id_type = 'InvalidType';
        await createPatientWebhook(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid resource type',
        });
    });

    it('should return an error if resource ID is missing', async () => {
        mockRequest.body.resource_id = undefined;
        await createPatientWebhook(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith({
            message: 'Invalid resource ID',
        });
    });

    it('should create schedulers for onboarding', async () => {
        await createPatientWebhook(mockRequest, mockResponse);

        const mockSend = (
            Clients.scheduler.send as jest.Mock
        ).mockResolvedValue({});
        expect(mockSend).toHaveBeenCalledTimes(3);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith({ message: 'success' });
    });

    it('should send patient onboarding email', async () => {
        await createPatientWebhook(mockRequest, mockResponse);
        expect(sendPatientCreationEmail).toHaveBeenCalledWith(
            ['user@example.com', 'guardian@example.com'],
            'John',
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith({ message: 'success' });
    });
});
