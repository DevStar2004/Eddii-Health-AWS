import { Request, Response } from 'lambda-api';
import {
    createPatient as createPatientFromHealthie,
    updatePatient as updatePatientFromHealthie,
    getPatient as getPatientFromHealthie,
    getProvider as getProviderFromHealthie,
    listMedications,
    listAppointments,
    getAppointment,
    doesPatientOwnAppointment,
    listProviders as listProvidersFromHealthie,
    HEALTHIE_INITIAL_VIRTUAL_CONSULTATION_APPT_TYPE,
    listAvailabilities,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    listConversations,
    doesPatientOwnConversation,
    getConversation,
    addChatMessageToConversation,
    listFormCompletionRequests as listFormCompletionRequestsFromHealthie,
    listOnboardingForms as listOnboardingFormsFromHealthie,
    getEddiiForm,
    getEddiiInsurancePlans,
    HEALTHIE_CARE_CENTER_SETUP_FORM,
    fillOutForm,
    HEALTHIE_TRIAGE_HYPER_FLOW_FORM,
    HEALTHIE_TRIAGE_HYPO_FLOW_FORM,
    HEALTHIE_TRIAGE_WRONG_DOSE_FLOW_FORM,
    HEALTHIE_TRIAGE_SICK_DAY_FLOW_FORM,
    HEALTHIE_REQUEST_PRESCRIPTION_FORM,
    getZoomMeetingJWT,
    HEALTHIE_HYPER_FLOW_ANSWER_LOOKUP,
    HEALTHIE_HYPO_FLOW_ANSWER_LOOKUP,
    HEALTHIE_WRONG_DOSE_FLOW_ANSWER_LOOKUP,
    HEALTHIE_SICK_DAY_FLOW_ANSWER_LOOKUP,
    SUPPORTED_PROVIDER_IDS,
    createDocument as createDocumentFromHealthie,
    getDocument as getDocumentFromHealthie,
    doesPatientOwnDocument,
    listDocuments as listDocumentsFromHealthie,
    deleteDocument as deleteDocumentFromHealthie,
    createApiKeyForUser,
    healthieProxyRequest,
    hasPatientCompletedInitialVisit,
    HEALTHIE_FOLLOW_UP_VIRTUAL_CONSULTATION_APPT_TYPE,
    createPaymentDetails,
    listPaymentDetails,
    doesPatientOwnPaymentDetails,
    updatePaymentDetails,
    deletePaymentDetails,
    getDefaultProviderId,
    HEALTHIE_FIRST_APPOINTMENT_FORM,
} from '@eddii-backend/healthie';
import {
    GuardianRole,
    GuardianStatus,
    createGuardian,
    createPatient as createPatientFromDal,
    getGuardianForUser,
    getPatient as getPatientFromDal,
    getUser,
} from '@eddii-backend/dal';
import {
    isValidDate,
    isValidHealthieAppointmentDate,
    validArbitraryString,
    validFormSlug,
    validHolderRelationship,
    validInsuranceType,
    validNumericString,
    validSmallString,
    validTimeZone,
    getLocation,
    validDataBase64String,
} from '@eddii-backend/utils';

const getAppointmentTypeId = async (patientId: string): Promise<string> => {
    try {
        const hasCompleted = await hasPatientCompletedInitialVisit(patientId);
        if (hasCompleted) {
            return HEALTHIE_FOLLOW_UP_VIRTUAL_CONSULTATION_APPT_TYPE;
        } else {
            return HEALTHIE_INITIAL_VIRTUAL_CONSULTATION_APPT_TYPE;
        }
    } catch (e) {
        console.warn('Failed to check previous appointments', e);
        return HEALTHIE_INITIAL_VIRTUAL_CONSULTATION_APPT_TYPE;
    }
};

const getState = async (request: Request): Promise<string | undefined> => {
    let state: string;
    if (process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging') {
        const sourceIp = request.requestContext.identity.sourceIp;
        if (sourceIp) {
            const location = await getLocation(sourceIp);
            state = location?.region;
        }
    } else {
        // Emulate state in dev and sandbox.
        state = 'TX';
    }
    return state;
};

export const createPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { firstName, lastName } = request.body;
    if (!firstName) {
        response.status(400).json({ message: 'Missing First Name.' });
        return;
    }
    if (!lastName) {
        response.status(400).json({ message: 'Missing Last Name.' });
        return;
    }
    if (!validSmallString(firstName) || !validSmallString(lastName)) {
        response.status(400).json({ message: 'Invalid First or Last Name.' });
        return;
    }
    const state = await getState(request);
    if (!state) {
        response.status(400).json({ message: 'Missing State.' });
        return;
    }

    const userInDb = await getPatientFromDal(email);
    if (userInDb) {
        response.status(400).json({ message: 'Patient already exists.' });
        return;
    }

    const user = await getUser(email);
    if (!user) {
        const guardian = await getGuardianForUser(request.guardianEmail, email);
        if (!guardian) {
            // Creating a patient for a user that doesn't exist in the system
            // Setup guardian link
            await createGuardian(
                request.guardianEmail,
                email,
                GuardianStatus.active,
                GuardianRole.guardian,
            );
        }
    }

    const providerId = getDefaultProviderId(state);
    const patient = await createPatientFromHealthie(
        firstName,
        lastName,
        email,
        providerId,
    );
    if (!patient || !patient.id) {
        response.status(500).json({ message: 'Failed to create patient.' });
        return;
    }
    // Create Healthie API Key
    let apiKey;
    try {
        apiKey = await createApiKeyForUser(patient.id);
    } catch (e) {
        console.warn('Failed to create API Key for user', e);
    }
    await createPatientFromDal(email, patient.id, apiKey?.displayable_key);
    response.status(200).json(patient);
};

export const updatePatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    let { policies } = request.body;
    // TODO Backwards Compatibility
    if (!policies) {
        policies = [request.body.policy];
    }

    for (const policy of policies) {
        if (!policy) {
            response.status(400).json({ message: 'Missing Policy.' });
            return;
        }
        if (typeof policy !== 'object' || !policy) {
            response.status(400).json({ message: 'Policy must be an object.' });
            return;
        }
        if (
            !policy.insurancePlanId ||
            !validSmallString(policy.insurancePlanId)
        ) {
            response
                .status(400)
                .json({ message: 'Invalid Insurance Plan ID.' });
            return;
        }
        if (
            !policy.type ||
            (policy.type.toLowerCase() !== 'primary' &&
                policy.type.toLowerCase() !== 'secondary' &&
                policy.type.toLowerCase() !== 'inactive')
        ) {
            response.status(400).json({ message: 'Invalid Type.' });
            return;
        }
        if (
            !policy.holderRelationship ||
            !validHolderRelationship(policy.holderRelationship)
        ) {
            response
                .status(400)
                .json({ message: 'Invalid Holder Relationship.' });
            return;
        }
        if (
            !policy.insuranceType ||
            !validInsuranceType(policy.insuranceType)
        ) {
            response.status(400).json({ message: 'Invalid Insurance Type.' });
            return;
        }
        if (!policy.memberId || !validSmallString(policy.memberId)) {
            response.status(400).json({ message: 'Invalid Member ID.' });
            return;
        }
        if (policy.holderDob && !isValidDate(policy.holderDob)) {
            response.status(400).json({ message: 'Invalid Holder DOB.' });
            return;
        }
        if (
            policy.holderFirstName &&
            !validSmallString(policy.holderFirstName)
        ) {
            response
                .status(400)
                .json({ message: 'Invalid Holder First Name.' });
            return;
        }
        if (policy.holderLastName && !validSmallString(policy.holderLastName)) {
            response.status(400).json({ message: 'Invalid Holder Last Name.' });
            return;
        }
    }

    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const patient = await updatePatientFromHealthie(
        user.patientId,
        policies.map(policy => {
            return {
                holder_location: {
                    country: 'US',
                },
                holder_relationship: policy.holderRelationship,
                insurance_plan_id: policy.insurancePlanId,
                num: policy.memberId,
                payer_location: {
                    country: 'US',
                },
                priority_type: policy.type.toLowerCase(),
                type_string: policy.insuranceType,
                ...(policy.holderDob && { holder_dob: policy.holderDob }),
                ...(policy.holderFirstName && {
                    holder_first: policy.holderFirstName,
                }),
                ...(policy.holderLastName && {
                    holder_last: policy.holderLastName,
                }),
                ...(policy.id && {
                    id: policy.id,
                }),
                ...(policy._destroy && {
                    _destroy: true,
                }),
            };
        }),
    );
    response.status(200).json(patient);
};

export const getPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const healthiePatient = await getPatientFromHealthie(patient.patientId);
    response.status(200).json(healthiePatient);
};

export const listMedicationsForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const medications = await listMedications(patient.patientId);
    response.status(200).json({ medications });
};

export const listAppointmentsForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const appointments = await listAppointments(patient.patientId);
    response.status(200).json({ appointments });
};

export const createAppointmentForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { providerId, appointmentDate, timeZone, notes } = request.body;
    if (!providerId) {
        response.status(400).json({ message: 'Missing Provider ID.' });
        return;
    }
    if (providerId && !validNumericString(providerId)) {
        response.status(400).json({ message: 'Invalid Provider ID.' });
        return;
    }
    if (!timeZone) {
        response.status(400).json({ message: 'Missing Time Zone.' });
        return;
    }
    if (timeZone && !validTimeZone(timeZone)) {
        response.status(400).json({ message: 'Invalid Time Zone.' });
        return;
    }
    if (!appointmentDate) {
        response.status(400).json({ message: 'Missing Appointment Date.' });
        return;
    }
    if (appointmentDate && !isValidHealthieAppointmentDate(appointmentDate)) {
        response.status(400).json({ message: 'Invalid Appointment Date.' });
        return;
    }
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const appointmentTypeId = await getAppointmentTypeId(patient.patientId);
    const availabilities = await listAvailabilities(
        appointmentTypeId,
        appointmentDate,
        appointmentDate,
        providerId,
        'TX',
        timeZone,
    );
    if (
        !availabilities ||
        availabilities.length === 0 ||
        !availabilities.find(a => a.date === appointmentDate)
    ) {
        response.status(400).json({ message: 'Invalid Appointment Date.' });
        return;
    }

    if (notes && !validArbitraryString(notes)) {
        response.status(400).json({ message: 'Invalid Notes.' });
        return;
    }
    const appointment = await createAppointment(
        patient.patientId,
        providerId,
        appointmentTypeId,
        appointmentDate,
        timeZone,
        notes,
    );
    response.status(200).json(appointment);
};

export const updateAppointmentForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const appointmentId = request.params.appointmentId;
    if (!appointmentId) {
        response.status(404).json({ message: 'Missing Appointment ID.' });
        return;
    }
    if (!validNumericString(appointmentId)) {
        response.status(400).json({ message: 'Invalid Appointment ID.' });
        return;
    }
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { providerId, appointmentDate, timeZone, notes } = request.body;
    if (!providerId) {
        response.status(400).json({ message: 'Missing Provider ID.' });
        return;
    }
    if (providerId && !validNumericString(providerId)) {
        response.status(400).json({ message: 'Invalid Provider ID.' });
        return;
    }
    if (!timeZone) {
        response.status(400).json({ message: 'Missing Time Zone.' });
        return;
    }
    if (timeZone && !validTimeZone(timeZone)) {
        response.status(400).json({ message: 'Invalid Time Zone.' });
        return;
    }
    if (!appointmentDate) {
        response.status(400).json({ message: 'Missing Appointment Date.' });
        return;
    }
    if (appointmentDate && !isValidHealthieAppointmentDate(appointmentDate)) {
        response.status(400).json({ message: 'Invalid Appointment Date.' });
        return;
    }
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const doesOwn = await doesPatientOwnAppointment(
        patient.patientId,
        appointmentId,
    );
    if (!doesOwn) {
        response.status(404).json({ message: 'Appointment not found.' });
        return;
    }
    const appointment = await getAppointment(appointmentId);
    if (!appointment) {
        response.status(404).json({ message: 'Appointment not found.' });
        return;
    }
    const availabilities = await listAvailabilities(
        appointment.appointment_type.id,
        appointmentDate,
        appointmentDate,
        providerId,
        'TX',
        timeZone,
    );
    if (
        !availabilities ||
        availabilities.length === 0 ||
        !availabilities.find(a => a.date === appointmentDate)
    ) {
        response.status(400).json({ message: 'Invalid Appointment Date.' });
        return;
    }
    if (notes && !validArbitraryString(notes)) {
        response.status(400).json({ message: 'Invalid Notes.' });
        return;
    }
    const updatedAppointment = await updateAppointment(
        appointmentId,
        appointmentDate,
        timeZone,
        notes,
    );
    response.status(200).json(updatedAppointment);
};

export const cancelAppointmentForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const appointmentId = request.params.appointmentId;
    if (!appointmentId) {
        response.status(404).json({ message: 'Missing Appointment ID.' });
        return;
    }
    if (!validNumericString(appointmentId)) {
        response.status(400).json({ message: 'Invalid Appointment ID.' });
        return;
    }
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const doesOwn = await doesPatientOwnAppointment(
        patient.patientId,
        appointmentId,
    );
    if (!doesOwn) {
        response.status(404).json({ message: 'Appointment not found.' });
        return;
    }
    const appointment = await cancelAppointment(appointmentId);
    response.status(200).json(appointment);
};

export const getAppointmentForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const appointmentId = request.params.appointmentId;
    if (!appointmentId) {
        response.status(404).json({ message: 'Missing Appointment ID.' });
        return;
    }
    if (!validNumericString(appointmentId)) {
        response.status(400).json({ message: 'Invalid Appointment ID.' });
        return;
    }
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const doesOwn = await doesPatientOwnAppointment(
        patient.patientId,
        appointmentId,
    );
    if (!doesOwn) {
        response.status(404).json({ message: 'Appointment not found.' });
        return;
    }
    let appointment: any = await getAppointment(appointmentId);
    if (!appointment) {
        response.status(404).json({ message: 'Appointment not found.' });
        return;
    }
    let jwt: string;
    if (process.env['ENV'] === 'dev' || process.env['ENV'] === 'sandbox') {
        // Healthie isn't available in dev and sandbox, so we'll just return a fake JWT
        jwt = '';
    } else {
        if (appointment.zoom_meeting_id && appointment.date) {
            jwt = await getZoomMeetingJWT(appointment.zoom_meeting_id);
        }
    }

    if (jwt) {
        appointment = {
            ...appointment,
            zoom_meeting_jwt: jwt,
        };
    }
    if (
        appointment.appointment_type?.id ===
        HEALTHIE_INITIAL_VIRTUAL_CONSULTATION_APPT_TYPE
    ) {
        appointment = {
            ...appointment,
            tasks: [
                {
                    title: 'Connect to Dexcom Clarity',
                    description:
                        "If your child is using a Dexcom CGM, please connect to our clinic's portal using the share code below, so your doctor can review blood sugars and understand your concerns better.",
                    link: 'https://connect.dexcom.com/',
                    code: 'g3w26z44',
                },
                {
                    title: 'Complete Pre-appointment Questions:',
                    description:
                        'Help your doctor prepare for the appointment by answering some questions before your appointment.',
                    formId: HEALTHIE_FIRST_APPOINTMENT_FORM,
                },
            ],
        };
    }
    response.status(200).json(appointment);
};

export const listProviders = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const state = await getState(request);
    if (!state) {
        response.status(400).json({ message: 'Missing State.' });
        return;
    }
    let providers = await listProvidersFromHealthie(state);
    providers = providers.filter(p => SUPPORTED_PROVIDER_IDS.has(p.id));
    response.status(200).json({ providers });
};

export const getProvider = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const providerId = request.params.providerId;
    if (!providerId) {
        response.status(404).json({ message: 'Missing Provider ID.' });
        return;
    }
    const healthiePatient = await getProviderFromHealthie(providerId);
    response.status(200).json(healthiePatient);
};

export const listAvailabilityForProvider = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const state = await getState(request);
    if (!state) {
        response.status(400).json({ message: 'Missing State.' });
        return;
    }
    const providerId = request.params.providerId;
    if (!providerId) {
        response.status(404).json({ message: 'Missing Provider ID.' });
        return;
    }
    if (!request.query) {
        response.status(400).json({ message: 'Missing Query Strings.' });
        return;
    }
    const { startDate, endDate, timeZone } = request.query;
    if (!startDate) {
        response.status(400).json({ message: 'Missing Start Date.' });
        return;
    }
    if (startDate && !isValidDate(startDate)) {
        response.status(400).json({ message: 'Invalid Start Date.' });
        return;
    }
    if (!endDate) {
        response.status(400).json({ message: 'Missing End Date.' });
        return;
    }
    if (endDate && !isValidDate(endDate)) {
        response.status(400).json({ message: 'Invalid End Date.' });
        return;
    }
    if (!providerId) {
        response.status(400).json({ message: 'Missing Provider ID.' });
        return;
    }
    if (providerId && !validNumericString(providerId)) {
        response.status(400).json({ message: 'Invalid Provider ID.' });
        return;
    }
    if (!timeZone) {
        response.status(400).json({ message: 'Missing Time Zone.' });
        return;
    }
    if (timeZone && !validTimeZone(timeZone)) {
        response.status(400).json({ message: 'Invalid Time Zone.' });
        return;
    }
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const appointmentTypeId = await getAppointmentTypeId(patient.patientId);
    const availabilities = await listAvailabilities(
        appointmentTypeId,
        startDate,
        endDate,
        providerId,
        state,
        timeZone,
    );
    response.status(200).json({ availabilities });
};

export const listConversationsForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const conversations = await listConversations(patient.patientId);
    response.status(200).json({ conversations });
};

export const getConversationForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const conversationId = request.params.conversationId;
    if (!conversationId) {
        response.status(404).json({ message: 'Missing Conversation ID.' });
        return;
    }
    if (!validNumericString(conversationId)) {
        response.status(400).json({ message: 'Invalid Conversation ID.' });
        return;
    }
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const doesOwn = await doesPatientOwnConversation(
        patient.patientId,
        conversationId,
    );
    if (!doesOwn) {
        response.status(404).json({ message: 'Conversation not found.' });
        return;
    }
    const conversation = await getConversation(conversationId);
    if (!conversation) {
        response.status(404).json({ message: 'Conversation not found.' });
        return;
    }
    response.status(200).json(conversation);
};

export const addChatToConversationForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { content, attachedImage } = request.body;
    const conversationId = request.params.conversationId;
    if (!conversationId) {
        response.status(404).json({ message: 'Missing Conversation ID.' });
        return;
    }
    if (!validNumericString(conversationId)) {
        response.status(400).json({ message: 'Invalid Conversation ID.' });
        return;
    }
    if (!content && !attachedImage) {
        response.status(400).json({ message: 'Missing Content.' });
        return;
    }
    if (content && !validArbitraryString(content)) {
        response.status(400).json({ message: 'Invalid Content.' });
        return;
    }
    if (attachedImage && !validDataBase64String(attachedImage)) {
        response.status(400).json({ message: 'Invalid Attached Image.' });
        return;
    }
    const patient = await getPatientFromDal(email);
    if (!patient) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const doesOwn = await doesPatientOwnConversation(
        patient.patientId,
        conversationId,
    );
    if (!doesOwn) {
        response.status(404).json({ message: 'Conversation not found.' });
        return;
    }
    const note = await addChatMessageToConversation(
        patient.patientId,
        conversationId,
        content,
        attachedImage,
    );
    response.status(200).json(note);
};

const getFormId = (formSlug: string): string | undefined => {
    let formId = undefined;
    if (formSlug === 'care-center-setup') {
        formId = HEALTHIE_CARE_CENTER_SETUP_FORM;
    } else if (formSlug === 'triage-hyper-flow') {
        formId = HEALTHIE_TRIAGE_HYPER_FLOW_FORM;
    } else if (formSlug === 'triage-hypo-flow') {
        formId = HEALTHIE_TRIAGE_HYPO_FLOW_FORM;
    } else if (formSlug === 'triage-wrong-dose-flow') {
        formId = HEALTHIE_TRIAGE_WRONG_DOSE_FLOW_FORM;
    } else if (formSlug === 'triage-sick-day-flow') {
        formId = HEALTHIE_TRIAGE_SICK_DAY_FLOW_FORM;
    } else if (formSlug === 'request-prescription') {
        formId = HEALTHIE_REQUEST_PRESCRIPTION_FORM;
    } else if (formSlug === 'first-appointment') {
        formId = HEALTHIE_FIRST_APPOINTMENT_FORM;
    } else {
        formId = formSlug;
    }
    return formId;
};

const getFormAnswerLookup = (formSlug: string): string | undefined => {
    let formLookup = undefined;
    if (formSlug === 'triage-hyper-flow') {
        formLookup = HEALTHIE_HYPER_FLOW_ANSWER_LOOKUP;
    } else if (formSlug === 'triage-hypo-flow') {
        formLookup = HEALTHIE_HYPO_FLOW_ANSWER_LOOKUP;
    } else if (formSlug === 'triage-wrong-dose-flow') {
        formLookup = HEALTHIE_WRONG_DOSE_FLOW_ANSWER_LOOKUP;
    } else if (formSlug === 'triage-sick-day-flow') {
        formLookup = HEALTHIE_SICK_DAY_FLOW_ANSWER_LOOKUP;
    }
    return formLookup;
};

export const listFormCompletionRequests = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const requests = await listFormCompletionRequestsFromHealthie(
        user.patientId,
    );
    response.status(200).json(requests);
};

export const listOnboardingForms = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const forms = await listOnboardingFormsFromHealthie(user.patientId);
    if (forms?.onboarding_items) {
        forms.onboarding_items = forms.onboarding_items.map((item: any) => {
            item.completed = item.completed_onboarding_item?.id ? true : false;
            return item;
        });
    }
    response.status(200).json(forms);
};

export const getForm = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const formSlug = request.params.formSlug;
    if (!validFormSlug(formSlug)) {
        response.status(400).json({ message: 'Invalid Form ID.' });
        return;
    }
    const formId = getFormId(formSlug);
    if (!formId) {
        response.status(400).json({ message: 'Invalid Form Slug.' });
        return;
    }
    const form = await getEddiiForm(formId);
    // Update form to what the FE expects
    const lookup = getFormAnswerLookup(formSlug);
    const eddiiForm: any = form;
    if (lookup) {
        for (const customModule of eddiiForm.custom_modules) {
            customModule.options = customModule.options.split('\n');
            customModule.options = customModule.options.map(
                (option: string) => {
                    const trimmedOption = option.trim();
                    return {
                        label: trimmedOption,
                        nextCustomModuleId:
                            lookup[customModule.id][trimmedOption],
                    };
                },
            );
        }
        eddiiForm.startingCustomModuleId = lookup['start'];
    }
    response.status(200).json(eddiiForm);
};

export const fillOutFormForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const formSlug = request.params.formSlug;
    if (!validFormSlug(formSlug)) {
        response.status(400).json({ message: 'Invalid Form Slug.' });
        return;
    }
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { answers } = request.body;
    if (!answers) {
        response.status(400).json({ message: 'Missing Answers.' });
        return;
    }
    if (!Array.isArray(answers)) {
        response.status(400).json({ message: 'Invalid Answers.' });
        return;
    }
    for (const answer of answers) {
        if (
            typeof answer !== 'object' ||
            answer === null ||
            answer.customModuleId === undefined ||
            answer.answer === undefined
        ) {
            response.status(400).json({ message: 'Invalid answer format.' });
            return;
        }
    }
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const formAnswers = answers.map(answer => ({
        custom_module_id: answer.customModuleId,
        answer: answer.answer,
        user_id: user.patientId,
    }));

    const formId = getFormId(formSlug);
    if (!formId) {
        response.status(400).json({ message: 'Invalid Form Slug.' });
        return;
    }
    const formGroupAnswer = await fillOutForm(
        formId,
        user.patientId,
        formAnswers,
    );
    response.status(200).json(formGroupAnswer);
};

export const bulkFillOutFormForPatient = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;

    if (!request.body) {
        return response.status(400).json({ message: 'Missing body.' });
    }
    const { formAnswers } = request.body;
    if (!formAnswers) {
        return response.status(400).json({ message: 'Missing Answers.' });
    }
    if (!Array.isArray(formAnswers)) {
        return response.status(400).json({ message: 'Invalid Answers.' });
    }

    if (formAnswers.length > 5) {
        return response.status(400).json({ message: 'Answer form limit to 5' });
    }

    for (const answer of formAnswers) {
        const { formSlug, answers } = answer;
        if (!validFormSlug(formSlug)) {
            return response.status(400).json({ message: 'Invalid Form Slug.' });
        }
        if (!Array.isArray(answers)) {
            return response.status(400).json({ message: 'Invalid Answers.' });
        }
        for (const answer of answers) {
            if (
                typeof answer !== 'object' ||
                answer === null ||
                answer.customModuleId === undefined ||
                answer.answer === undefined
            ) {
                return response
                    .status(400)
                    .json({ message: 'Invalid answer format.' });
            }
        }
    }

    const user = await getPatientFromDal(email);
    if (!user) {
        return response.status(404).json({ message: 'Patient doesnt exists.' });
    }

    const result = [];

    for (const answer of formAnswers) {
        const { formSlug, answers } = answer;
        const formAnswers = answers.map(answer => ({
            custom_module_id: answer.customModuleId,
            answer: answer.answer,
            user_id: user.patientId,
        }));

        const formId = getFormId(formSlug);
        if (!formId) {
            response.status(400).json({ message: 'Invalid Form Slug.' });
            return;
        }
        const formGroupAnswer = await fillOutForm(
            formId,
            user.patientId,
            formAnswers,
        );
        result.push({
            ...formGroupAnswer,
            formSlug,
        });
    }

    return response.status(200).json(result);
};

export const getInsurancePlans = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const plans = await getEddiiInsurancePlans();
    plans.sort((a, b) => a.payer_name.localeCompare(b.payer_name));
    response.status(200).json(plans);
};

export const createDocument = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { fileString, displayName } = request.body;
    if (!fileString) {
        response.status(400).json({ message: 'Missing File.' });
        return;
    }
    if (!validDataBase64String(fileString)) {
        response.status(400).json({ message: 'Invalid Document.' });
        return;
    }
    if (!displayName) {
        response.status(400).json({ message: 'Missing Display Name.' });
        return;
    }
    if (!validSmallString(displayName)) {
        response.status(400).json({ message: 'Invalid Display Name.' });
        return;
    }
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const document = await createDocumentFromHealthie(
        user.patientId,
        displayName,
        fileString,
    );
    response.status(200).json(document);
};

export const getDocument = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const documentId = request.params.documentId;
    if (!documentId) {
        response.status(404).json({ message: 'Missing Document ID.' });
        return;
    }
    if (!validNumericString(documentId)) {
        response.status(400).json({ message: 'Invalid Document ID.' });
        return;
    }
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const doesOwn = await doesPatientOwnDocument(user.patientId, documentId);
    if (!doesOwn) {
        response.status(404).json({ message: 'Document not found.' });
        return;
    }
    const document = await getDocumentFromHealthie(documentId);
    if (!document) {
        response.status(404).json({ message: 'Document not found.' });
        return;
    }
    response.status(200).json(document);
};

export const listDocuments = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const documents = await listDocumentsFromHealthie(user.patientId);
    response.status(200).json(documents);
};

export const deleteDocument = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const documentId = request.params.documentId;
    if (!documentId) {
        response.status(404).json({ message: 'Missing Document ID.' });
        return;
    }
    if (!validNumericString(documentId)) {
        response.status(400).json({ message: 'Invalid Document ID.' });
        return;
    }
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const doesOwn = await doesPatientOwnDocument(user.patientId, documentId);
    if (!doesOwn) {
        response.status(404).json({ message: 'Document not found.' });
        return;
    }
    const documentToDelete = await getDocumentFromHealthie(documentId);
    if (!documentToDelete) {
        response.status(404).json({ message: 'Document not found.' });
        return;
    }
    const document = await deleteDocumentFromHealthie(documentId);
    response.status(200).json(document);
};

export const healthieProxy = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const body = request.body;
    if (
        !Array.isArray(body) &&
        body?.query &&
        body.query.startsWith('subscription')
    ) {
        // No-op for subscription requests as we dont support that yet.
        response.status(204).json({});
        return;
    }
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    if (!user.healthieApiKey) {
        response.status(400).json({ message: 'Missing Healthie API Key.' });
        return;
    }
    const healthieResponse = await healthieProxyRequest(
        body,
        user.healthieApiKey,
    );
    response.status(healthieResponse.status).json(healthieResponse.data);
};

export const createPayment = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { token, cardTypeLabel } = request.body;
    if (!token) {
        response.status(400).json({ message: 'Missing Payment Token.' });
        return;
    }
    if (!validArbitraryString(token)) {
        response.status(400).json({ message: 'Invalid Token.' });
        return;
    }
    if (
        cardTypeLabel &&
        cardTypeLabel !== 'personal' &&
        cardTypeLabel !== 'hsa' &&
        cardTypeLabel !== 'fsa'
    ) {
        response.status(400).json({ message: 'Invalid Card Label Type.' });
        return;
    }
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const paymentDetails = await createPaymentDetails(
        user.patientId,
        token,
        cardTypeLabel,
    );
    response.status(200).json(paymentDetails);
};

export const listPayments = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const paymentDetails = await listPaymentDetails(user.patientId);
    response.status(200).json(paymentDetails);
};

export const updatePayment = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const paymentId = request.params.paymentId;
    const { cardTypeLabel, isDefault } = request.body;
    if (!paymentId) {
        response.status(400).json({ message: 'Missing Payment ID.' });
        return;
    }
    if (!validNumericString(paymentId)) {
        response.status(400).json({ message: 'Invalid Payment ID.' });
        return;
    }
    if (isDefault !== undefined && typeof isDefault !== 'boolean') {
        response.status(400).json({ message: 'Invalid IsDefault.' });
        return;
    }
    if (
        cardTypeLabel &&
        cardTypeLabel !== 'personal' &&
        cardTypeLabel !== 'hsa' &&
        cardTypeLabel !== 'fsa'
    ) {
        response.status(400).json({ message: 'Invalid Card Label Type.' });
        return;
    }
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const doesOwn = await doesPatientOwnPaymentDetails(
        user.patientId,
        paymentId,
    );
    if (!doesOwn) {
        response.status(404).json({ message: 'Payment not found.' });
        return;
    }
    const paymentDetails = await updatePaymentDetails(
        user.patientId,
        paymentId,
        cardTypeLabel,
        isDefault,
    );
    response.status(200).json(paymentDetails);
};

export const deletePayment = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const paymentId = request.params.paymentId;
    if (!paymentId) {
        response.status(400).json({ message: 'Missing Payment ID.' });
        return;
    }
    if (!validNumericString(paymentId)) {
        response.status(400).json({ message: 'Invalid Payment ID.' });
        return;
    }
    const user = await getPatientFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'Patient doesnt exists.' });
        return;
    }
    const doesOwn = await doesPatientOwnPaymentDetails(
        user.patientId,
        paymentId,
    );
    if (!doesOwn) {
        response.status(404).json({ message: 'Payment not found.' });
        return;
    }
    const paymentDetails = await deletePaymentDetails(
        user.patientId,
        paymentId,
    );
    response.status(200).json(paymentDetails);
};
