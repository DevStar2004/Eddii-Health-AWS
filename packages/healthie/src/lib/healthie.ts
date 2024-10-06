import { getSecret } from '@eddii-backend/secrets';
import { GraphQLClient, gql } from 'graphql-request';
import {
    ApiKey,
    Appointment,
    ClientPolicyInput,
    Conversation,
    ConversationMembership,
    CustomModuleForm,
    Document,
    FormAnswerGroup,
    FormAnswerInput,
    InsurancePlan,
    MedicationType,
    Note,
    OnboardingFlow,
    PotentialAppointmentSlot,
    RequestedFormCompletion,
    StripeCustomerDetail,
    User,
} from '../../__generated__/graphql';

export const DEFAULT_EDDII_ID =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '4039295'
        : '986378';

export const DEFAULT_PROVIDER_ID =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '3769958'
        : '573364';

export const SUPPORTED_PROVIDER_IDS =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? new Set(['3769958', '4808603'])
        : new Set(['573364']);

export const HEALTHIE_INITIAL_VIRTUAL_CONSULTATION_APPT_TYPE =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '375222'
        : '128940';

export const HEALTHIE_FOLLOW_UP_VIRTUAL_CONSULTATION_APPT_TYPE =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '374714'
        : '53249';

export const HEALTHIE_CARE_CENTER_SETUP_FORM =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '1878873'
        : '927892';

export const HEALTHIE_TRIAGE_HYPER_FLOW_FORM =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '1878874'
        : '938954';

export const HEALTHIE_HYPER_FLOW_ANSWER_LOOKUP =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? {
              start: '24089854',
              '24089854': {
                  'Less than 150': '24089985',
                  '150 - 200': '24089985',
                  '200 - 350': '24089985',
                  'Greater than 350': '24089985',
              },
              '24089985': {
                  'Yes, with urine check': '24089986',
                  'Yes, with blood sample': '24089987',
                  No: 'ketone-check',
              },
              '24089986': {
                  'Negative urine check': '24089988',
                  'Trace urine check': '24089988',
                  'Moderate urine check': '24089988',
                  'Large urine check': '24089988',
              },
              '24089987': {
                  'Less than 0.6': '24089988',
                  '0.6 - 1': '24089988',
                  '1 - 3': '24089988',
              },
              '24089988': {
                  Yes: 'seek-medical',
                  No: '24089989',
              },
              '24089989': {
                  'More than 3 hours ago': 'chat',
                  'Less than 3 hours ago': 'chat',
              },
          }
        : {
              start: '8144604',
              '8144604': {
                  'Less than 150': '8144605',
                  '150 - 200': '8144605',
                  '200 - 350': '8144605',
                  'Greater than 350': '8144605',
              },
              '8144605': {
                  'Yes, with urine check': '8144606',
                  'Yes, with blood sample': '8144607',
                  No: 'ketone-check',
              },
              '8144606': {
                  'Negative urine check': '8144608',
                  'Trace urine check': '8144608',
                  'Moderate urine check': '8144608',
                  'Large urine check': '8144608',
              },
              '8144607': {
                  'Less than 0.6': '8144608',
                  '0.6 - 1': '8144608',
                  '1 - 3': '8144608',
              },
              '8144608': {
                  Yes: 'seek-medical',
                  No: '8144609',
              },
              '8144609': {
                  'More than 3 hours ago': 'chat',
                  'Less than 3 hours ago': 'chat',
              },
          };

export const HEALTHIE_TRIAGE_HYPO_FLOW_FORM =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '1878891'
        : '945391';

export const HEALTHIE_HYPO_FLOW_ANSWER_LOOKUP =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? {
              start: '24089990',
              '24089990': {
                  'Less than 55': '24089992',
                  '55 - 59': '24089992',
                  '60 - 69': '24089992',
                  'Greater than or equal to 70': '24089993',
              },
              '24089991': {
                  Yes: 'chat',
                  No: 'treat-low',
              },
              '24089992': {
                  Yes: 'seek-medical',
                  No: '24089993',
              },
              '24089993': {
                  Yes: '24089991',
                  No: '24089991',
              },
          }
        : {
              start: '8198237',
              '8198237': {
                  'Less than 55': '8198239',
                  '55 - 59': '8198239',
                  '60 - 69': '8198239',
                  'Greater than or equal to 70': '8198240',
              },
              '8198238': {
                  Yes: 'chat',
                  No: 'treat-low',
              },
              '8198239': {
                  Yes: 'seek-medical',
                  No: '8198240',
              },
              '8198240': {
                  Yes: '8198238',
                  No: '8198238',
              },
          };

export const HEALTHIE_TRIAGE_WRONG_DOSE_FLOW_FORM =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '1878892'
        : '945392';

export const HEALTHIE_WRONG_DOSE_FLOW_ANSWER_LOOKUP =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? {
              start: '24089994',
              '24089994': {
                  'Rapid Acting': '24089995',
                  'Long Acting': '24089995',
              },
              '24089995': {
                  More: 'wrong-dose-more',
                  Less: 'wrong-dose-less',
              },
          }
        : {
              start: '8198241',
              '8198241': {
                  'Rapid Acting': '8198242',
                  'Long Acting': '8198242',
              },
              '8198242': {
                  More: 'wrong-dose-more',
                  Less: 'wrong-dose-less',
              },
          };

export const HEALTHIE_TRIAGE_SICK_DAY_FLOW_FORM =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '1878893'
        : '945393';

export const HEALTHIE_SICK_DAY_FLOW_ANSWER_LOOKUP =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? {
              start: '24089996',
              '24089996': {
                  High: '24089997',
                  Low: 'sick-day-low',
                  Normal: 'sick-day-normal',
              },
              '24089997': {
                  'Yes, with a urine check': '24089999',
                  'Yes, with a blood sample': '24089998',
                  No: 'ketone-check',
              },
              '24089998': {
                  'Less than 0.6': 'sick-day-normal',
                  '0.6 - 1': '24090000',
                  '1 - 3': '24090000',
              },
              '24089999': {
                  'Negative urine check': '24090000',
                  'Trace urine check': '24090000',
                  'Moderate urine check': '24090000',
                  'Large urine check': '24090000',
              },
              '24090000': {
                  Yes: 'seek-medical',
                  No: 'sick-day-high',
              },
          }
        : {
              start: '8198244',
              '8198244': {
                  High: '8198245',
                  Low: 'sick-day-low',
                  Normal: 'sick-day-normal',
              },
              '8198245': {
                  'Yes, with a urine check': '8198246',
                  'Yes, with a blood sample': '8198247',
                  No: 'ketone-check',
              },
              '8198247': {
                  'Less than 0.6': 'sick-day-normal',
                  '0.6 - 1': '8198248',
                  '1 - 3': '8198248',
              },
              '8198246': {
                  'Negative urine check': '8198248',
                  'Trace urine check': '8198248',
                  'Moderate urine check': '8198248',
                  'Large urine check': '8198248',
              },
              '8198248': {
                  Yes: 'seek-medical',
                  No: 'sick-day-high',
              },
          };

export const HEALTHIE_REQUEST_PRESCRIPTION_FORM =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '1878894'
        : '946170';

export const HEALTHIE_FIRST_APPOINTMENT_FORM =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? '2211098'
        : '1509894';

const APPOINTMENT_NOTES_DENY_LIST = [
    'Diagnosis',
    'CPT Code',
    'Total time spent',
    'Billing',
    'Modifier',
    'Signature',
];

const healthieEndpoint =
    process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging'
        ? 'https://api.gethealthie.com/graphql'
        : 'https://staging-api.gethealthie.com/graphql';

const getGqlClient = async () => {
    const healthieApiKey = await getSecret(
        process.env['HEALTHIE_API_KEY'] as string,
    );
    return getGqlClientViaApiKey(healthieApiKey);
};

const getGqlClientViaApiKey = (healthieApiKey: string) => {
    const graphQLClient = new GraphQLClient(healthieEndpoint, {
        headers: {
            Authorization: `Basic ${healthieApiKey}`,
            AuthorizationSource: 'API',
        },
    });
    return graphQLClient;
};

export const getDefaultProviderId = (location: string): string => {
    if (process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging') {
        if (location === 'NY') {
            return '4808603';
        } else {
            return DEFAULT_PROVIDER_ID;
        }
    } else {
        return DEFAULT_PROVIDER_ID;
    }
};

export const createPatient = async (
    firstName: string,
    lastName: string,
    email: string,
    providerId: string,
): Promise<User> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation createClient(
            $first_name: String
            $last_name: String
            $email: String
            $skipped_email: Boolean
            $skip_set_password_state: Boolean
            $dietitian_id: String
            $dont_send_welcome: Boolean
        ) {
            createClient(
                input: {
                    first_name: $first_name
                    last_name: $last_name
                    email: $email
                    skipped_email: $skipped_email
                    skip_set_password_state: $skip_set_password_state
                    dietitian_id: $dietitian_id
                    dont_send_welcome: $dont_send_welcome
                }
            ) {
                user {
                    id
                    first_name
                    last_name
                    email
                }
            }
        }
    `;
    console.log(
        `Creating patient for ${firstName} ${lastName} (${email}) with provider ${providerId}`,
    );
    const response: any = await graphQLClient.request(mutation, {
        first_name: firstName,
        last_name: lastName,
        email: email,
        skipped_email: false,
        skip_set_password_state: true,
        dietitian_id: providerId,
        dont_send_welcome: true,
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    return response.createClient.user as User;
};

export const updatePatient = async (
    id: string,
    policies: ClientPolicyInput[],
): Promise<User> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation updateClient($id: ID, $policies: [ClientPolicyInput]) {
            updateClient(input: { id: $id, policies: $policies }) {
                user {
                    id
                }
            }
        }
    `;
    console.log(`Updating patient for ${id}`);
    const response: any = await graphQLClient.request(mutation, {
        id: id,
        policies: policies,
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    return response.updateClient.user as User;
};

//export const getPatientIdByEmail = async (email: string): Promise<string> => {
//    const graphQLClient = await getGqlClient();
//
//    const query = gql`
//        query users($keywords: String) {
//            users(keywords: $keywords) {
//                id
//            }
//        }
//    `;
//    const id = await graphQLClient.request(query, { keywords: email });
//    return id as string;
//};

export const getPatient = async (id: string): Promise<User> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query getUser($id: ID) {
            user(id: $id) {
                id
                first_name
                last_name
                email
                policies {
                    id
                    insurance_plan {
                        payer_name
                    }
                    holder_location {
                        country
                    }
                    holder_relationship
                    insurance_plan_id
                    num
                    payer_location {
                        country
                    }
                    priority_type
                    type_string
                    holder_dob
                    holder_first
                    holder_last
                    insurance_card_front_id
                    insurance_card_back_id
                }
                stripe_customer_details {
                    id
                }
            }
        }
    `;
    console.log(`Getting patient for ${id}`);
    const response: any = await graphQLClient.request(query, { id: id });
    console.log(`Response: ${JSON.stringify(response)}`);
    return response.user as User;
};

export const getProvider = async (id: string): Promise<User> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query getUser($id: ID) {
            user(id: $id) {
                id
                first_name
                last_name
                email
                qualifications
                metadata
                state_licenses {
                    state
                }
            }
        }
    `;
    console.log(`Getting provider for ${id}`);
    const response: any = await graphQLClient.request(query, { id: id });
    console.log(`Response: ${JSON.stringify(response)}`);
    return response.user as User;
};

export const listMedications = async (
    patientId: string,
): Promise<MedicationType[]> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query medications($patient_id: ID) {
            medications(patient_id: $patient_id) {
                id
                name
                active
                directions
                dosage
                code
                start_date
                end_date
            }
        }
    `;
    console.log(`Listing medications for patient ${patientId}`);
    const response: any = await graphQLClient.request(query, {
        patient_id: patientId,
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    return response.medications as MedicationType[];
};

export const listAppointments = async (
    patientId: string,
): Promise<Appointment[]> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query appointments($user_id: ID, $filter: String, $offset: Int) {
            appointments(
                user_id: $user_id
                filter: $filter
                is_org: true
                offset: $offset
            ) {
                id
                date
                start
                end
                contact_type
                length
                location
                pm_status
                provider {
                    id
                    full_name
                    avatar_url
                }
                appointment_type {
                    name
                    id
                }
                attendees {
                    id
                    first_name
                }
            }
        }
    `;
    console.log(`Listing appointments for patient ${patientId}`);
    const response: any = await graphQLClient.request(query, {
        user_id: patientId,
        filter: 'all',
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    const appointments = response.appointments as Appointment[];
    if (!appointments) {
        return [];
    }
    return appointments.filter(a => a.pm_status !== 'Cancelled');
};

export const doesPatientOwnAppointment = async (
    patientId: string,
    appointmentId: string,
): Promise<boolean> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query appointments($user_id: ID, $filter: String, $offset: Int) {
            appointments(
                user_id: $user_id
                filter: $filter
                is_org: true
                offset: $offset
            ) {
                id
            }
        }
    `;
    console.log(`Listing appointments for patient ${patientId}`);
    const response: any = await graphQLClient.request(query, {
        user_id: patientId,
        filter: 'all',
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    const appointments = response.appointments as Appointment[];
    return appointments.some(a => a.id === appointmentId);
};

export const hasPatientCompletedInitialVisit = async (
    patientId: string,
): Promise<boolean> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query appointments(
            $user_id: ID
            $filter: String
            $filter_by_appointment_type_id: ID
        ) {
            appointments(
                user_id: $user_id
                filter: $filter
                is_org: true
                filter_by_appointment_type_id: $filter_by_appointment_type_id
            ) {
                id
                pm_status
            }
        }
    `;
    console.log(`Listing appointments for patient ${patientId}`);
    const response: any = await graphQLClient.request(query, {
        user_id: patientId,
        filter: 'all',
        filter_by_appointment_type_id:
            HEALTHIE_INITIAL_VIRTUAL_CONSULTATION_APPT_TYPE,
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    const appointments = response.appointments as Appointment[];
    return appointments.some(a => a.pm_status === 'Occurred');
};

export const getAppointment = async (
    appointmentId: string,
): Promise<Appointment> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query getAppointment($id: ID) {
            appointment(id: $id) {
                id
                date
                start
                end
                length
                timezone_abbr
                contact_type
                pm_status
                appointment_category
                appointment_label
                confirmed
                minimum_advance_cancel_time
                minimum_advance_reschedule_time
                pricing_info {
                    cpt_code_id
                    price
                    units
                }
                reason
                notes
                title
                zoom_join_url
                zoom_meeting_id
                provider {
                    id
                    full_name
                    first_name
                    avatar_url
                    qualifications
                    metadata
                }
                user {
                    id
                    first_name
                }
                appointment_type {
                    id
                    name
                }
                filled_embed_form {
                    id
                    name
                    form_answers {
                        label
                        displayed_answer
                    }
                }
                form_answer_group {
                    id
                    name
                    form_answers {
                        label
                        displayed_answer
                    }
                }
            }
        }
    `;
    console.log(`Getting appointment ${appointmentId}`);
    const response: any = await graphQLClient.request(query, {
        id: appointmentId,
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    const appointment = response.appointment as Appointment;
    if (
        appointment?.form_answer_group?.form_answers &&
        appointment?.form_answer_group?.form_answers?.length > 0
    ) {
        appointment.form_answer_group.form_answers =
            appointment.form_answer_group.form_answers.filter(
                (a: any) =>
                    !APPOINTMENT_NOTES_DENY_LIST.some(denyItem =>
                        a.label.includes(denyItem),
                    ),
            );
    }
    return appointment;
};

export const getZoomMeetingJWT = async (zoomId: string): Promise<string> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query zoomSdkJwt($mn: String, $role: String) {
            zoomSdkJwt(mn: $mn, role: $role)
        }
    `;
    console.log(`Getting zoom JWT ${zoomId}`);
    const response: any = await graphQLClient.request(query, {
        mn: zoomId,
        role: '0',
    });
    return response.zoomSdkJwt;
};

export const listProviders = async (
    licensed_in_state?: string,
    offset?: number,
): Promise<User[]> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query getOrganizationMembers(
            $licensed_in_state: String
            $offset: Int
            $page_size: Int
        ) {
            organizationMembers(
                page_size: $page_size
                offset: $offset
                licensed_in_state: $licensed_in_state
            ) {
                id
                first_name
                last_name
                avatar_url
                email
                qualifications
            }
        }
    `;
    const variables = {
        licensed_in_state,
        offset,
        page_size: 100,
    };
    const response: any = await graphQLClient.request(query, variables);
    return response.organizationMembers as User[];
};

export const listAvailabilities = async (
    appointmentTypeId: string,
    startDate: string,
    endDate: string,
    providerId: string,
    licensedInState: string,
    timeZone: string,
): Promise<PotentialAppointmentSlot[]> => {
    const graphQLClient = await getGqlClient();
    const query = gql`
        query getAvailableSlotsForRange(
            $appt_type_id: String
            $start_date: String
            $end_date: String
            $licensed_in_state: String
            $provider_id: String
            $timezone: String
        ) {
            availableSlotsForRange(
                appt_type_id: $appt_type_id
                licensed_in_state: $licensed_in_state
                provider_id: $provider_id
                start_date: $start_date
                end_date: $end_date
                timezone: $timezone
            ) {
                date
                is_fully_booked
                length
            }
        }
    `;
    const variables = {
        appt_type_id: appointmentTypeId,
        start_date: startDate,
        end_date: endDate,
        licensed_in_state: licensedInState,
        provider_id: providerId,
        timezone: timeZone,
    };
    const response: any = await graphQLClient.request(query, variables);
    const availableSlots =
        response.availableSlotsForRange as PotentialAppointmentSlot[];
    return availableSlots.filter(
        slot =>
            slot.date &&
            !slot.is_fully_booked &&
            new Date(slot.date).getMinutes() % 15 === 0,
    );
};

export const createAppointment = async (
    userId: string,
    providerId: string,
    appointmentTypeId: string,
    appointmentDate: string,
    timeZone: string,
    notes?: string,
): Promise<Appointment> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation createAppointment(
            $user_id: String
            $appointment_type_id: String
            $contact_type: String
            $other_party_id: String
            $datetime: String
            $timezone: String
            $notes: String
            $is_zoom_chat: Boolean
        ) {
            createAppointment(
                input: {
                    user_id: $user_id
                    appointment_type_id: $appointment_type_id
                    contact_type: $contact_type
                    other_party_id: $other_party_id
                    datetime: $datetime
                    timezone: $timezone
                    notes: $notes
                    is_zoom_chat: $is_zoom_chat
                }
            ) {
                appointment {
                    id
                }
            }
        }
    `;
    console.log(`Creating appointment for ${userId} to ${providerId}`);
    const response: any = await graphQLClient.request(mutation, {
        user_id: userId,
        appointment_type_id: appointmentTypeId,
        contact_type: 'Healthie Video Call',
        other_party_id: providerId,
        datetime: appointmentDate,
        timezone: timeZone,
        notes: notes,
        is_zoom_chat: true,
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    return response.createAppointment.appointment as Appointment;
};

export const updateAppointment = async (
    appointmentId: string,
    appointmentDate: string,
    timeZone: string,
    notes?: string,
): Promise<Appointment> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation updateAppointment(
            $id: ID
            $datetime: String
            $timezone: String
            $notes: String
        ) {
            updateAppointment(
                input: {
                    id: $id
                    datetime: $datetime
                    timezone: $timezone
                    notes: $notes
                }
            ) {
                appointment {
                    id
                }
            }
        }
    `;
    console.log(`Updating appointment for ${appointmentId}`);
    const response: any = await graphQLClient.request(mutation, {
        id: appointmentId,
        datetime: appointmentDate,
        timezone: timeZone,
        notes: notes,
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    return response.updateAppointment.appointment as Appointment;
};

export const cancelAppointment = async (
    appointmentId: string,
): Promise<Appointment> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation updateAppointment($id: ID, $pm_status: String) {
            updateAppointment(input: { id: $id, pm_status: $pm_status }) {
                appointment {
                    id
                }
            }
        }
    `;
    console.log(`Cancelling appointment for ${appointmentId}`);
    const response: any = await graphQLClient.request(mutation, {
        id: appointmentId,
        pm_status: 'Cancelled',
    });
    console.log(`Response: ${JSON.stringify(response)}`);
    return response.updateAppointment.appointment as Appointment;
};

export const listConversations = async (
    userId: string,
): Promise<ConversationMembership[]> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query conversationMemberships($client_id: String) {
            conversationMemberships(client_id: $client_id) {
                id
                display_name
                display_avatar
                display_other_user_name
                viewed
                convo {
                    id
                    created_at
                    updated_at
                    last_message_content
                }
            }
        }
    `;

    const variables = {
        client_id: userId,
    };

    const response: any = await graphQLClient.request(query, variables);
    return response.conversationMemberships as ConversationMembership[];
};

export const doesPatientOwnConversation = async (
    patientId: string,
    conversationId: string,
): Promise<boolean> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query conversationMemberships($client_id: String) {
            conversationMemberships(client_id: $client_id) {
                convo {
                    id
                }
            }
        }
    `;

    const variables = {
        client_id: patientId,
    };

    const response: any = await graphQLClient.request(query, variables);
    const conversations =
        response.conversationMemberships as ConversationMembership[];
    return conversations.some(
        (c: ConversationMembership) => c.convo?.id === conversationId,
    );
};

export const getConversation = async (
    conversationId: string,
): Promise<Conversation> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query getConversation($id: ID) {
            conversation(id: $id) {
                id
                name
                patient_id
                owner {
                    id
                }
                updated_at
                invitees {
                    id
                }
                notes {
                    id
                    content
                    attached_image_url
                    created_at
                    creator {
                        id
                        full_name
                        avatar_url
                    }
                }
            }
        }
    `;

    const variables = {
        id: conversationId,
    };

    const response: any = await graphQLClient.request(query, variables);
    return response.conversation as Conversation;
};

export const getNote = async (noteId: string): Promise<Note> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query getNote($id: ID) {
            note(id: $id) {
                id
                conversation_id
                created_at
                creator {
                    id
                    full_name
                }
            }
        }
    `;

    const variables = {
        id: noteId,
    };

    const response: any = await graphQLClient.request(query, variables);
    return response.note as Note;
};

export const addChatMessageToConversation = async (
    userId: string,
    conversationId: string,
    content: string,
    attachedImage?: string,
): Promise<Note> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation createNote(
            $user_id: String
            $conversation_id: String
            $content: String
            $attached_image_string: String
        ) {
            createNote(
                input: {
                    user_id: $user_id
                    conversation_id: $conversation_id
                    content: $content
                    attached_image_string: $attached_image_string
                }
            ) {
                note {
                    id
                    content
                    created_at
                    creator {
                        full_name
                    }
                }
            }
        }
    `;

    const variables = {
        user_id: userId,
        conversation_id: conversationId,
        content: content,
        attached_image_string: attachedImage,
    };

    console.log(`Creating chat for ${conversationId}`);
    const response: any = await graphQLClient.request(mutation, variables);
    return response.createNote.note as Note;
};

export const listFormCompletionRequests = async (
    userId: string,
): Promise<RequestedFormCompletion[]> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query requestedFormCompletions($userId: ID) {
            requestedFormCompletions(user_id: $userId) {
                id
                status
                date_to_show
                item_type
                custom_module_form_id
            }
        }
    `;

    const variables = {
        userId: userId,
    };

    const response: any = await graphQLClient.request(query, variables);
    return response.requestedFormCompletions as RequestedFormCompletion[];
};

export const listOnboardingForms = async (
    userId: string,
): Promise<OnboardingFlow> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query onboardingFlow($user_id: ID) {
            onboardingFlow(user_id: $user_id) {
                id
                name
                onboarding_items {
                    id
                    item_id
                    completed_onboarding_item {
                        id
                    }
                    date_to_show
                    display_name
                }
            }
        }
    `;

    const variables = {
        user_id: userId,
    };

    const response: any = await graphQLClient.request(query, variables);
    return response.onboardingFlow as OnboardingFlow;
};

export const getEddiiForm = async (
    formId: string,
): Promise<CustomModuleForm> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query form($id: ID) {
            customModuleForm(id: $id) {
                id
                name
                custom_modules {
                    id
                    label
                    required
                    mod_type
                    options
                }
            }
        }
    `;

    const variables = {
        id: formId,
    };

    const response: any = await graphQLClient.request(query, variables);
    return response.customModuleForm as CustomModuleForm;
};

export const fillOutForm = async (
    formId: string,
    userId: string,
    formAnswers: FormAnswerInput[],
): Promise<FormAnswerGroup> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation createFormAnswerGroup(
            # Should almost always true
            $finished: Boolean
            # ID of the custom_module_form (e.g "100")
            $custom_module_form_id: String
            # ID of the patient (e.g "61")
            $user_id: String
            # e.g [{custom_module_id: "1", answer: "foo", user_id: "61"}, {custom_module_id: "2", answer: "bar", user_id: "61"}]
            $form_answers: [FormAnswerInput!]!
        ) {
            createFormAnswerGroup(
                input: {
                    finished: $finished
                    custom_module_form_id: $custom_module_form_id
                    user_id: $user_id
                    form_answers: $form_answers
                }
            ) {
                form_answer_group {
                    id
                }
            }
        }
    `;
    const variables = {
        finished: true,
        custom_module_form_id: formId,
        user_id: userId,
        form_answers: formAnswers,
    };

    console.log(`Filling out form ${formId} for ${userId}`);
    const response: any = await graphQLClient.request(mutation, variables);
    return response.createFormAnswerGroup.form_answer_group as FormAnswerGroup;
};

export const getEddiiInsurancePlans = async (): Promise<InsurancePlan[]> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query insurancePlans($is_accepted: Boolean) {
            insurancePlans(is_accepted: $is_accepted) {
                id
                payer_id
                payer_name
            }
        }
    `;

    const variables = {};

    const response: any = await graphQLClient.request(query, variables);
    return response.insurancePlans as InsurancePlan[];
};

export const listDocuments = async (userId: string): Promise<Document[]> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query documents($private_user_id: String) {
            documents(private_user_id: $private_user_id) {
                id
                display_name
                file_content_type
            }
        }
    `;

    const variables = {
        private_user_id: userId,
    };

    const response: any = await graphQLClient.request(query, variables);
    return response.documents as Document[];
};

export const doesPatientOwnDocument = async (
    patientId: string,
    documentId: string,
): Promise<boolean> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query documents($private_user_id: String) {
            documents(private_user_id: $private_user_id) {
                id
            }
        }
    `;
    const variables = {
        private_user_id: patientId,
    };
    const response: any = await graphQLClient.request(query, variables);
    const documents = response.documents as Document[];
    return documents.some(a => a.id === documentId);
};

export const getDocument = async (documentId: string): Promise<Document> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query document($id: ID) {
            document(id: $id) {
                id
                display_name
                file_content_type
                expiring_url
            }
        }
    `;

    const variables = {
        id: documentId,
    };

    const response: any = await graphQLClient.request(query, variables);
    return response.document as Document;
};

export const createDocument = async (
    userId: string,
    displayName: string,
    fileString: string,
): Promise<Document> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation createDocument(
            $file_string: String
            $display_name: String
            $rel_user_id: String
            $share_with_rel: Boolean
        ) {
            createDocument(
                input: {
                    file_string: $file_string
                    display_name: $display_name
                    rel_user_id: $rel_user_id
                    share_with_rel: $share_with_rel
                }
            ) {
                document {
                    id
                }
            }
        }
    `;

    const variables = {
        file_string: fileString,
        display_name: displayName,
        rel_user_id: userId,
        share_with_rel: true,
    };

    console.log(`Creating document for ${userId}`);
    const response: any = await graphQLClient.request(mutation, variables);
    return response.createDocument.document as Document;
};

export const deleteDocument = async (documentId: string): Promise<Document> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation deleteDocument($id: ID) {
            deleteDocument(input: { id: $id }) {
                document {
                    id
                }
            }
        }
    `;

    const variables = {
        id: documentId,
    };

    console.log(`Deleting document ${documentId}`);
    const response: any = await graphQLClient.request(mutation, variables);
    return response.deleteDocument.document as Document;
};

export const createApiKeyForUser = async (userId: string): Promise<ApiKey> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation createApiKey($user_id: ID) {
            createApiKey(input: { user_id: $user_id }) {
                api_key
                messages {
                    field
                    message
                }
            }
        }
    `;

    const variables = {
        user_id: userId,
    };

    console.log(`Creating API Key for ${userId}`);
    const response: any = await graphQLClient.request(mutation, variables);
    return response.createApiKey as ApiKey;
};

export const healthieProxyRequest = async (
    body: any,
    apiKey: string,
): Promise<{ status: number; data: any }> => {
    const graphQLClient = getGqlClientViaApiKey(apiKey);
    try {
        if (Array.isArray(body)) {
            const response = await graphQLClient.batchRequests(body);
            return { status: 200, data: response };
        } else {
            const response = await graphQLClient.request(
                body.query,
                body.variables,
            );
            return { status: 200, data: { data: response } };
        }
    } catch (error: any) {
        console.error(
            `Error in proxying request to Healthie: ${error.message}`,
        );
        return {
            status: error.response?.status || 500,
            data: { message: error.message },
        };
    }
};

export const createPaymentDetails = async (
    patientId: string,
    token: string,
    cardTypeLabel?: string,
): Promise<StripeCustomerDetail> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation createStripeCustomerDetail(
            $token: String
            $card_type_label: String
            $user_id: ID
        ) {
            createStripeCustomerDetail(
                input: {
                    token: $token
                    card_type_label: $card_type_label
                    user_id: $user_id
                }
            ) {
                stripe_customer_detail {
                    id
                }
            }
        }
    `;

    const variables = {
        user_id: patientId,
        token: token,
        card_type_label: cardTypeLabel,
    };

    console.log(`Creating Payment Details for ${patientId}`);
    const response: any = await graphQLClient.request(mutation, variables);
    return response.createStripeCustomerDetail
        .stripe_customer_detail as StripeCustomerDetail;
};

export const updatePaymentDetails = async (
    patientId: string,
    paymentDetailId: string,
    cardTypeLabel?: string,
    isDefault?: boolean,
): Promise<StripeCustomerDetail> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation updateStripeCustomerDetail(
            $id: ID
            $card_type_label: String
            $user_id: ID
            $is_default: Boolean
        ) {
            updateStripeCustomerDetail(
                input: {
                    id: $id
                    card_type_label: $card_type_label
                    user_id: $user_id
                    is_default: $is_default
                }
            ) {
                stripe_customer_detail {
                    id
                }
            }
        }
    `;

    const variables = {
        user_id: patientId,
        id: paymentDetailId,
        ...(cardTypeLabel && { card_type_label: cardTypeLabel }),
        ...(isDefault !== undefined && { is_default: isDefault }),
    };

    console.log(
        `Updating Payment Details for ${patientId} for ${paymentDetailId}`,
    );
    const response: any = await graphQLClient.request(mutation, variables);
    return response.updateStripeCustomerDetail
        .stripe_customer_detail as StripeCustomerDetail;
};

export const deletePaymentDetails = async (
    patientId: string,
    paymentDetailId: string,
): Promise<StripeCustomerDetail> => {
    const graphQLClient = await getGqlClient();

    const mutation = gql`
        mutation deleteStripeCustomerDetailInput(
            $card_id: String
            $user_id: String
        ) {
            deleteStripeCustomerDetail(
                input: { card_id: $card_id, user_id: $user_id }
            ) {
                stripe_customer_detail {
                    id
                }
            }
        }
    `;

    const variables = {
        user_id: patientId,
        card_id: paymentDetailId,
    };

    console.log(
        `Deleting Payment Details for ${patientId} for ${paymentDetailId}`,
    );
    const response: any = await graphQLClient.request(mutation, variables);
    return response.deleteStripeCustomerDetail
        .stripe_customer_detail as StripeCustomerDetail;
};

export const listPaymentDetails = async (
    patientId: string,
): Promise<StripeCustomerDetail[]> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query stripeCustomerDetails($user_id: ID) {
            stripeCustomerDetails(user_id: $user_id) {
                id
                card_type
                card_type_label
                country
                expiration
                expiring_next_month
                last_four
                source_status
                source_type
                stripe_id
                zip
            }
        }
    `;
    console.log(`Listing payment details for patient ${patientId}`);
    const response: any = await graphQLClient.request(query, {
        user_id: patientId,
    });
    return response.stripeCustomerDetails as StripeCustomerDetail[];
};

export const doesPatientOwnPaymentDetails = async (
    patientId: string,
    paymentDetailId: string,
): Promise<boolean> => {
    const graphQLClient = await getGqlClient();

    const query = gql`
        query stripeCustomerDetails($user_id: ID) {
            stripeCustomerDetails(user_id: $user_id) {
                id
            }
        }
    `;
    const response: any = await graphQLClient.request(query, {
        user_id: patientId,
    });
    const paymentIds = response.stripeCustomerDetails as StripeCustomerDetail[];
    return paymentIds.some(a => a.id === paymentDetailId);
};
