import {
    GuardianRole,
    GuardianStatus,
    getPatientByPatientId,
    getUser,
    listGuardiansForUser,
} from '@eddii-backend/dal';
import { getPatient, listOnboardingForms } from '@eddii-backend/healthie';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';

export const sendOnboardingReminder = async (patientId: string) => {
    const healthiePatient = await getPatient(patientId);
    if (!healthiePatient) {
        throw new Error('Patient not found.');
    }
    const forms = await listOnboardingForms(patientId);
    const toDoForms = forms?.onboarding_items.some(
        form => form.completed_onboarding_item?.id === undefined,
    );
    const toDoInsurance = healthiePatient.policies
        ? healthiePatient?.policies.length === 0
        : true;

    const toDoBilling = healthiePatient.stripe_customer_details
        ? healthiePatient?.stripe_customer_details.length === 0
        : true;

    if (!toDoForms && !toDoInsurance && !toDoBilling) {
        return;
    }

    const title = `[ACTION REQUIRED]: Complete eddii-care onboarding`;
    const message =
        'You have some incomplete onboarding items. Please complete them in the app.';
    const patient = await getPatientByPatientId(patientId);
    if (!patient) {
        throw new Error('Patient not found.');
    }
    const guardians = await listGuardiansForUser(patient.email);
    const validGuardians = guardians.filter(
        g =>
            g.role !== GuardianRole.follower &&
            g.status !== GuardianStatus.pending,
    );
    // Send to guardians
    for await (const guardian of validGuardians) {
        const guardianUser = await getUser(guardian.guardianEmail);
        if (guardianUser) {
            await publishPushNotificationToUserTopicArn(
                guardianUser.userTopicArn,
                title,
                message,
                `onboarding/${patientId}`,
            );
        }
    }
    console.log('Sent onboarding reminder for patient:', patient);
};
