import { getPatient, listOnboardingForms } from '@eddii-backend/healthie';
import { sendOnboardingReminder } from './patient';
import {
    getPatientByPatientId,
    getUser,
    listGuardiansForUser,
} from '@eddii-backend/dal';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';

jest.mock('@eddii-backend/healthie');
jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/notifications');

describe('sendOnboardingReminder', () => {
    const patientId = 'test-patient-id';
    const mockHealthiePatient = {
        id: patientId,
        policies: [{ id: 'test' }],
        stripe_customer_details: [{ id: 'test' }],
    };
    const mockForms = {
        onboarding_items: [{ completed_onboarding_item: { id: 'test' } }],
    };
    const mockPatient = {
        id: patientId,
        email: 'patient@example.com',
    };
    const mockUser = {
        id: 'test-user-id',
        email: 'guardian@example.com',
        userTopicArn: 'arn:aws:sns:example',
    };
    const mockGuardians = [{ guardianEmail: mockUser.email }];

    beforeEach(() => {
        jest.resetAllMocks();
        (getPatient as jest.Mock).mockResolvedValue(mockHealthiePatient);
        (listOnboardingForms as jest.Mock).mockResolvedValue(mockForms);
        (getPatientByPatientId as jest.Mock).mockResolvedValue(mockPatient);
        (getUser as jest.Mock).mockResolvedValue(mockUser);
        (listGuardiansForUser as jest.Mock).mockResolvedValue(mockGuardians);
        (publishPushNotificationToUserTopicArn as jest.Mock).mockResolvedValue(
            {},
        );
    });

    it('should throw an error if healthie patient is not found', async () => {
        (getPatient as jest.Mock).mockResolvedValue(null);
        await expect(sendOnboardingReminder(patientId)).rejects.toThrow(
            'Patient not found.',
        );
    });

    it('should throw an error if DAL patient is not found', async () => {
        (getPatientByPatientId as jest.Mock).mockResolvedValue(null);
        (listOnboardingForms as jest.Mock).mockResolvedValue({
            onboarding_items: [{ completed_onboarding_item: undefined }],
        });
        await expect(sendOnboardingReminder(patientId)).rejects.toThrow(
            'Patient not found.',
        );
    });

    it('should send a push notification to each guardian if forms todo', async () => {
        (listOnboardingForms as jest.Mock).mockResolvedValue({
            onboarding_items: [{ completed_onboarding_item: undefined }],
        });
        await sendOnboardingReminder(patientId);
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockUser.userTopicArn,
            '[ACTION REQUIRED]: Complete eddii-care onboarding',
            'You have some incomplete onboarding items. Please complete them in the app.',
            `onboarding/${patientId}`,
        );
    });

    it('should send a push notification to each guardian if insurance todo', async () => {
        (getPatient as jest.Mock).mockResolvedValue({
            ...mockHealthiePatient,
            policies: [],
        });
        await sendOnboardingReminder(patientId);
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockUser.userTopicArn,
            '[ACTION REQUIRED]: Complete eddii-care onboarding',
            'You have some incomplete onboarding items. Please complete them in the app.',
            `onboarding/${patientId}`,
        );
    });

    //it('should send a push notification to each guardian if payment todo', async () => {
    //    (getPatient as jest.Mock).mockResolvedValue({
    //        ...mockHealthiePatient,
    //        stripe_customer_details: [],
    //    });
    //    await sendOnboardingReminder(patientId);
    //    expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
    //        mockUser.userTopicArn,
    //        '[ACTION REQUIRED]: Complete eddii-care onboarding',
    //        'You have some incomplete onboarding items. Please complete them in the app.',
    //        `onboarding/${patientId}`,
    //    );
    //});

    it('should not send a push notification if there are no onboarding items to complete', async () => {
        await sendOnboardingReminder(patientId);
        expect(publishPushNotificationToUserTopicArn).not.toHaveBeenCalled();
    });
});
