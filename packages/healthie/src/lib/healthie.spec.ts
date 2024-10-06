import {
    createPatient,
    updatePatient,
    getPatient,
    listMedications,
    listAppointments,
    getAppointment,
    doesPatientOwnAppointment,
    listProviders,
    listAvailabilities,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    listConversations,
    getConversation,
    doesPatientOwnConversation,
    addChatMessageToConversation,
    getProvider,
    getEddiiForm,
    fillOutForm,
    getEddiiInsurancePlans,
    getZoomMeetingJWT,
    listFormCompletionRequests,
    listDocuments,
    doesPatientOwnDocument,
    getDocument,
    createDocument,
    deleteDocument,
    listOnboardingForms,
    createApiKeyForUser,
    healthieProxyRequest,
    hasPatientCompletedInitialVisit,
    HEALTHIE_INITIAL_VIRTUAL_CONSULTATION_APPT_TYPE,
    deletePaymentDetails,
    updatePaymentDetails,
    createPaymentDetails,
    listPaymentDetails,
    doesPatientOwnPaymentDetails,
    getNote,
} from './healthie';
import { getSecret } from '@eddii-backend/secrets';
import { GraphQLClient } from 'graphql-request';

jest.mock('@eddii-backend/secrets');
jest.mock('graphql-request', () => {
    const originalModule = jest.requireActual('graphql-request');
    return {
        ...originalModule,
        gql: originalModule.gql,
    };
});

const mockGetSecret = getSecret as jest.MockedFunction<typeof getSecret>;
const mockGraphQLClient = GraphQLClient as jest.MockedClass<
    typeof GraphQLClient
>;

describe('healthie', () => {
    beforeEach(() => {
        mockGetSecret.mockResolvedValue('mocked_api_key');
        mockGraphQLClient.prototype.request = jest.fn();
        mockGraphQLClient.prototype.batchRequests = jest.fn();
    });

    describe('createPatient', () => {
        it('should create a patient and return user data', async () => {
            const mockUser: any = {
                id: '1',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                createClient: {
                    user: mockUser,
                },
            });

            const user = await createPatient(
                'John',
                'Doe',
                'john.doe@example.com',
                '123',
            );

            expect(user).toEqual(mockUser);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    first_name: 'John',
                    last_name: 'Doe',
                    email: 'john.doe@example.com',
                    skipped_email: false,
                    skip_set_password_state: true,
                    dietitian_id: '123',
                    dont_send_welcome: true,
                },
            );
        });
    });

    describe('updatePatient', () => {
        it('should update a patient with policy and return updated user data', async () => {
            const mockPolicy = {
                insurance_plan_id: 'plan123',
                holder_relationship: 'Self',
                type_string: 'Medicaid',
                num: 'P123456789',
                priority_type: 'primary',
                holder_location: { country: 'US' },
                payer_location: { country: 'US' },
            };

            const mockUpdatedUser: any = {
                id: '1',
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                updateClient: {
                    user: mockUpdatedUser,
                },
            });

            const updatedUser = await updatePatient('1', [mockPolicy]);

            expect(updatedUser).toEqual(mockUpdatedUser);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    id: '1',
                    policies: [mockPolicy],
                },
            );
        });
    });

    describe('getPatient', () => {
        it('should retrieve a patient by id and return user data', async () => {
            const mockUser: any = {
                id: '1',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                user: mockUser,
            });

            const user = await getPatient('1');

            expect(user).toEqual(mockUser);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    id: '1',
                },
            );
        });
    });

    describe('getProvider', () => {
        it('should retrieve a provider by id and return user data', async () => {
            const mockProvider: any = {
                id: '2',
                first_name: 'Alice',
                last_name: 'Smith',
                email: 'alice.smith@example.com',
                qualifications: 'MD',
                metadata: JSON.stringify({ about: 'about' }),
                state_licenses: [{ state: 'CA' }],
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                user: mockProvider,
            });

            const provider = await getProvider('2');

            expect(provider).toEqual(mockProvider);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    id: '2',
                },
            );
        });
    });

    describe('listMedications', () => {
        it('should list medications for a given patient ID', async () => {
            const mockMedications: any = [
                {
                    id: 'med1',
                    name: 'Aspirin',
                    active: true,
                    directions: 'Take one pill daily',
                    dosage: '100mg',
                    code: 'ASP',
                    start_date: '2021-01-01',
                    end_date: '2021-12-31',
                },
                // ... potentially more mocked medications
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                medications: mockMedications,
            });

            const medications = await listMedications('1');

            expect(medications).toEqual(mockMedications);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    patient_id: '1',
                },
            );
        });
    });

    describe('listAppointments', () => {
        it('should list appointments for a given patient ID', async () => {
            const mockAppointments: any = [
                {
                    id: 'app1',
                    date: '2021-01-01',
                    time: '10:00',
                    duration: 30,
                    type: 'Consultation',
                },
                // ... potentially more mocked appointments
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                appointments: mockAppointments,
            });

            const appointments = await listAppointments('1');

            expect(appointments).toEqual(mockAppointments);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    user_id: '1',
                    filter: 'all',
                },
            );
        });
    });

    describe('doesPatientOwnAppointment', () => {
        it('should return true if the patient owns the appointment', async () => {
            const mockAppointments: any = [
                { id: 'app1' },
                { id: 'app2' },
                // ... potentially more mocked appointments
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                appointments: mockAppointments,
            });

            const ownsAppointment = await doesPatientOwnAppointment(
                '1',
                'app1',
            );

            expect(ownsAppointment).toBe(true);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    user_id: '1',
                    filter: 'all',
                },
            );
        });

        it('should return false if the patient does not own the appointment', async () => {
            const mockAppointments: any = [
                { id: 'app1' },
                { id: 'app2' },
                // ... potentially more mocked appointments
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                appointments: mockAppointments,
            });

            const ownsAppointment = await doesPatientOwnAppointment(
                '1',
                'app3',
            );

            expect(ownsAppointment).toBe(false);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    user_id: '1',
                    filter: 'all',
                },
            );
        });
    });

    describe('hasPatientCompletedInitialVisit', () => {
        it('should return true if the patient has completed an initial visit', async () => {
            const mockAppointments: any = [
                { id: 'app1' },
                { id: 'app2', pm_status: 'Occurred' },
                // ... potentially more mocked appointments
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                appointments: mockAppointments,
            });

            const hasCompleted = await hasPatientCompletedInitialVisit('1');

            expect(hasCompleted).toBe(true);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    user_id: '1',
                    filter: 'all',
                    filter_by_appointment_type_id:
                        HEALTHIE_INITIAL_VIRTUAL_CONSULTATION_APPT_TYPE,
                },
            );
        });

        it('should return false if the patient has appointment but non occurred', async () => {
            const mockAppointments: any = [
                { id: 'app1' },
                { id: 'app2', pm_status: 'Other' },
                // ... potentially more mocked appointments
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                appointments: mockAppointments,
            });

            const hasCompleted = await hasPatientCompletedInitialVisit('1');

            expect(hasCompleted).toBe(false);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    user_id: '1',
                    filter: 'all',
                    filter_by_appointment_type_id:
                        HEALTHIE_INITIAL_VIRTUAL_CONSULTATION_APPT_TYPE,
                },
            );
        });

        it('should return false if the patient has not completed an initial visit', async () => {
            mockGraphQLClient.prototype.request.mockResolvedValue({
                appointments: [],
            });

            const hasCompleted = await hasPatientCompletedInitialVisit('1');

            expect(hasCompleted).toBe(false);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    user_id: '1',
                    filter: 'all',
                    filter_by_appointment_type_id:
                        HEALTHIE_INITIAL_VIRTUAL_CONSULTATION_APPT_TYPE,
                },
            );
        });
    });

    describe('getAppointment', () => {
        it('should return the appointment details for a given appointment ID', async () => {
            const mockAppointment: any = {
                id: 'app1',
                date: '2021-01-01',
                contact_type: 'In-person',
                pm_status: 'Confirmed',
                appointment_category: 'Check-up',
                appointment_label: 'Routine',
                confirmed: true,
                minimum_advance_cancel_time: 24,
                minimum_advance_reschedule_time: 24,
                pricing_info: 'Standard rate',
                reason: 'Annual physical',
                title: 'Annual Check-up',
                zoom_join_url: 'https://zoom.us/j/1234567890',
                provider: {
                    id: 'prov1',
                    full_name: 'Dr. Smith',
                },
                user: {
                    id: 'user1',
                },
                appointment_type: {
                    id: 'type1',
                    name: 'Consultation',
                },
                filled_embed_form: {
                    id: 'form1',
                    name: 'Health Screening Form',
                    form_answers: [
                        {
                            label: 'Question 1',
                            displayed_answer: 'Answer 1',
                        },
                        {
                            label: 'Question 2',
                            displayed_answer: 'Answer 2',
                        },
                    ],
                },
                form_answer_group: {
                    id: 'group1',
                    name: 'Initial Consultation Form',
                    form_answers: [
                        {
                            label: 'Question 3',
                            displayed_answer: 'Answer 3',
                        },
                        {
                            label: 'Question 4',
                            displayed_answer: 'Answer 4',
                        },
                    ],
                },
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                appointment: mockAppointment,
            });

            const appointment = await getAppointment('app1');

            expect(appointment).toEqual(mockAppointment);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    id: 'app1',
                },
            );
        });
    });

    describe('getZoomMeetingJWT', () => {
        it('should return a JWT for a Zoom meeting', async () => {
            const mockZoomId = '123456789';
            const mockZoomJwt = 'mock.jwt.token';

            mockGraphQLClient.prototype.request.mockResolvedValue({
                zoomSdkJwt: mockZoomJwt,
            });

            const jwt = await getZoomMeetingJWT(mockZoomId);

            expect(jwt).toEqual(mockZoomJwt);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    mn: mockZoomId,
                    role: '0',
                },
            );
        });
    });

    describe('listProviders', () => {
        it('should return a list of organization members', async () => {
            const mockOrganizationMembers = [
                {
                    id: 'member1',
                    first_name: 'John',
                    last_name: 'Doe',
                    avatar_url: 'http://example.com/avatar1.jpg',
                    email: 'john.doe@example.com',
                },
                {
                    id: 'member2',
                    first_name: 'Jane',
                    last_name: 'Doe',
                    avatar_url: 'http://example.com/avatar2.jpg',
                    email: 'jane.doe@example.com',
                },
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                organizationMembers: mockOrganizationMembers,
            });

            const licensed_in_state = 'CA';
            const members = await listProviders(licensed_in_state);

            expect(members).toEqual(mockOrganizationMembers);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    licensed_in_state,
                    offset: undefined,
                    page_size: 100,
                },
            );
        });
    });
    describe('listAvailabilitySlots', () => {
        it('should return available appointment slots', async () => {
            const mockAvailableSlots = [
                {
                    date: '2021-04-14',
                    is_fully_booked: false,
                    length: 30,
                },
                {
                    date: '2021-04-15',
                    is_fully_booked: true,
                    length: 30,
                },
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                availableSlotsForRange: mockAvailableSlots,
            });

            const appointmentTypeId = 'type1';
            const startDate = '2021-04-14';
            const endDate = '2021-04-15';
            const providerId = 'provider1';
            const licensedInState = 'CA';
            const timeZone = 'America/Los_Angeles';
            const slots = await listAvailabilities(
                appointmentTypeId,
                startDate,
                endDate,
                providerId,
                licensedInState,
                timeZone,
            );

            expect(slots).toEqual([
                {
                    date: '2021-04-14',
                    is_fully_booked: false,
                    length: 30,
                },
            ]);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    appt_type_id: appointmentTypeId,
                    start_date: startDate,
                    end_date: endDate,
                    licensed_in_state: licensedInState,
                    provider_id: providerId,
                    timezone: timeZone,
                },
            );
        });
    });

    describe('createAppointment', () => {
        it('should create an appointment successfully', async () => {
            const userId = 'user123';
            const providerId = 'provider123';
            const appointmentTypeId = 'apptType123';
            const appointmentDate = '2021-04-20T10:00:00Z';
            const timeZone = 'America/Los_Angeles';
            const notes = 'Initial consultation';

            const mockAppointment = {
                id: 'appointment123',
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                createAppointment: {
                    appointment: mockAppointment,
                },
            });

            const appointment = await createAppointment(
                userId,
                providerId,
                appointmentTypeId,
                appointmentDate,
                timeZone,
                notes,
            );

            expect(appointment).toEqual(mockAppointment);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    user_id: userId,
                    appointment_type_id: appointmentTypeId,
                    contact_type: 'Healthie Video Call',
                    other_party_id: providerId,
                    datetime: appointmentDate,
                    timezone: timeZone,
                    notes: notes,
                    is_zoom_chat: true,
                },
            );
        });
    });

    describe('updateAppointment', () => {
        it('should update an appointment successfully', async () => {
            const appointmentId = 'appointment123';
            const appointmentDate = '2021-04-21T10:00:00Z';
            const timeZone = 'America/Los_Angeles';
            const notes = 'Follow-up consultation';

            const mockUpdatedAppointment = {
                id: appointmentId,
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                updateAppointment: {
                    appointment: mockUpdatedAppointment,
                },
            });

            const updatedAppointment = await updateAppointment(
                appointmentId,
                appointmentDate,
                timeZone,
                notes,
            );

            expect(updatedAppointment).toEqual(mockUpdatedAppointment);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    id: appointmentId,
                    datetime: appointmentDate,
                    timezone: timeZone,
                    notes: notes,
                },
            );
        });
    });

    describe('cancelAppointment', () => {
        it('should cancel an appointment successfully', async () => {
            const appointmentId = 'appointment123';

            const mockCancelledAppointment = {
                id: appointmentId,
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                updateAppointment: {
                    appointment: mockCancelledAppointment,
                },
            });

            const cancelledAppointment = await cancelAppointment(appointmentId);

            expect(cancelledAppointment).toEqual(mockCancelledAppointment);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    id: appointmentId,
                    pm_status: 'Cancelled',
                },
            );
        });
    });

    describe('listConversations', () => {
        it('should list conversation memberships for a user', async () => {
            const userId = 'user123';
            const mockConversations = [
                {
                    id: 'convo1',
                    display_name: 'Conversation 1',
                    display_other_user_name: 'User A',
                    viewed: true,
                    convo: {
                        id: '1',
                        last_message_content: 'hi',
                    },
                },
                {
                    id: 'convo2',
                    display_name: 'Conversation 2',
                    display_other_user_name: 'User B',
                    viewed: false,
                    convo: {
                        id: '2',
                        last_message_content: 'hi',
                    },
                },
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                conversationMemberships: mockConversations,
            });

            const conversations = await listConversations(userId);

            expect(conversations).toEqual(mockConversations);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    client_id: userId,
                },
            );
        });
    });

    describe('doesPatientOwnConversation', () => {
        it('should return true when owns', async () => {
            const userId = 'user123';
            const mockConversations = [
                {
                    convo: {
                        id: '1',
                    },
                },
                {
                    convo: {
                        id: '2',
                    },
                },
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                conversationMemberships: mockConversations,
            });

            const doesOwn = await doesPatientOwnConversation(userId, '2');

            expect(doesOwn).toEqual(true);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    client_id: userId,
                },
            );
        });

        it('should return false when does not owns', async () => {
            const userId = 'user123';
            const mockConversations = [
                {
                    convo: {
                        id: '1',
                    },
                },
                {
                    convo: {
                        id: '2',
                    },
                },
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                conversationMemberships: mockConversations,
            });

            const doesOwn = await doesPatientOwnConversation(userId, '3');

            expect(doesOwn).toEqual(false);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    client_id: userId,
                },
            );
        });
    });

    describe('getConversation', () => {
        it('should retrieve a specific conversation by id', async () => {
            const conversationId = 'convo123';
            const mockConversation = {
                id: 'convo123',
                name: 'Test Conversation',
                updated_at: '2021-04-01T00:00:00Z',
                notes: [
                    {
                        id: 'note1',
                        content: 'This is a note',
                    },
                ],
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                conversation: mockConversation,
            });

            const conversation = await getConversation(conversationId);

            expect(conversation).toEqual(mockConversation);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    id: conversationId,
                },
            );
        });
    });

    describe('getNote', () => {
        it('should retrieve a specific note by id', async () => {
            const noteId = 'note123';
            const mockNote = {
                id: 'note123',
                conversation_id: 'convo123',
                created_at: '2021-04-01T00:00:00Z',
                creator: {
                    id: 'creator123',
                    full_name: 'Jane Doe',
                },
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                note: mockNote,
            });

            const note = await getNote(noteId);

            expect(note).toEqual(mockNote);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    id: noteId,
                },
            );
        });
    });

    describe('addChatMessageToConversation', () => {
        it('should add a chat message to a conversation', async () => {
            const userId = 'user123';
            const conversationId = 'convo123';
            const content = 'This is a new chat message';
            const mockNote = {
                id: 'note123',
                content: content,
                created_at: '2021-04-01T00:00:00Z',
                creator: {
                    full_name: 'John Doe',
                },
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                createNote: { note: mockNote },
            });

            const note = await addChatMessageToConversation(
                userId,
                conversationId,
                content,
            );

            expect(note).toEqual(mockNote);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    user_id: userId,
                    conversation_id: conversationId,
                    content: content,
                },
            );
        });
    });

    describe('listFormCompletionRequests', () => {
        it('should list form completion requests for a user', async () => {
            const userId = 'user789';
            const mockRequestedFormCompletions = [
                {
                    id: 'req123',
                    status: 'pending',
                    date_to_show: '2021-05-01T00:00:00Z',
                    item_type: 'form',
                    custom_module_form_id: 'form123',
                },
                {
                    id: 'req456',
                    status: 'completed',
                    date_to_show: '2021-06-01T00:00:00Z',
                    item_type: 'form',
                    custom_module_form_id: 'form456',
                },
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                requestedFormCompletions: mockRequestedFormCompletions,
            });

            const formCompletionRequests =
                await listFormCompletionRequests(userId);

            expect(formCompletionRequests).toEqual(
                mockRequestedFormCompletions,
            );
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    userId: userId,
                },
            );
        });
    });

    describe('listOnboardingForms', () => {
        it('should list onboarding forms for a user', async () => {
            const userId = 'user123';
            const mockOnboardingFlow = {
                id: 'onboard123',
                name: 'Onboarding Process',
                onboarding_items: [
                    {
                        id: 'item123',
                        item_id: 'form123',
                        date_to_show: '2021-07-01T00:00:00Z',
                        display_name: 'Welcome Form',
                    },
                    {
                        id: 'item456',
                        item_id: 'form456',
                        date_to_show: '2021-07-02T00:00:00Z',
                        display_name: 'Health Assessment',
                    },
                ],
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                onboardingFlow: mockOnboardingFlow,
            });

            const onboardingForms = await listOnboardingForms(userId);

            expect(onboardingForms).toEqual(mockOnboardingFlow);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    user_id: userId,
                },
            );
        });
    });

    describe('getEddiiForm', () => {
        it('should fetch a form with the given id', async () => {
            const formId = 'form123';
            const mockForm = {
                id: formId,
                name: 'Health Assessment',
                custom_modules: [
                    {
                        id: 'module123',
                        label: 'Module Label',
                        mod_type: 'text',
                        options: null,
                    },
                ],
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                customModuleForm: mockForm,
            });

            const form = await getEddiiForm(formId);

            expect(form).toEqual(mockForm);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    id: formId,
                },
            );
        });
    });

    describe('fillOutForm', () => {
        it('should submit form answers and return the form answer group', async () => {
            const formId = 'form123';
            const userId = 'user456';
            const formAnswers = [
                {
                    custom_module_id: 'module1',
                    answer: 'Answer 1',
                    user_id: userId,
                },
                {
                    custom_module_id: 'module2',
                    answer: 'Answer 2',
                    user_id: userId,
                },
            ];
            const mockFormAnswerGroup = {
                id: 'answerGroup123',
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                createFormAnswerGroup: {
                    form_answer_group: mockFormAnswerGroup,
                },
            });

            const result = await fillOutForm(formId, userId, formAnswers);

            expect(result).toEqual(mockFormAnswerGroup);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    finished: true,
                    custom_module_form_id: formId,
                    user_id: userId,
                    form_answers: formAnswers,
                },
            );
        });
    });

    describe('getEddiiInsurancePlans', () => {
        it('should fetch insurance plans and return them', async () => {
            const mockInsurancePlans = [
                { id: 'plan1', payer_name: 'Insurance Plan 1' },
                { id: 'plan2', payer_name: 'Insurance Plan 2' },
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                insurancePlans: mockInsurancePlans,
            });

            const insurancePlans = await getEddiiInsurancePlans();

            expect(insurancePlans).toEqual(mockInsurancePlans);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {},
            );
        });
    });

    describe('listDocuments', () => {
        const userId = 'user123';
        it('should return a list of documents for the user', async () => {
            const mockDocuments = [
                {
                    id: 'doc1',
                    display_name: 'Document 1',
                    file_content_type: 'application/pdf',
                },
                {
                    id: 'doc2',
                    display_name: 'Document 2',
                    file_content_type: 'image/jpeg',
                },
            ];

            mockGraphQLClient.prototype.request.mockResolvedValue({
                documents: mockDocuments,
            });

            const documents = await listDocuments(userId);

            expect(documents).toEqual(mockDocuments);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    private_user_id: userId,
                },
            );
        });
    });

    describe('doesPatientOwnDocument', () => {
        const userId = 'user123';
        const documentId = 'doc456';
        it('should return true if the patient owns the document', async () => {
            mockGraphQLClient.prototype.request.mockResolvedValue({
                documents: [{ id: documentId }],
            });

            const ownsDocument = await doesPatientOwnDocument(
                userId,
                documentId,
            );

            expect(ownsDocument).toBe(true);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    private_user_id: userId,
                },
            );
        });

        it('should return false if the patient does not own the document', async () => {
            mockGraphQLClient.prototype.request.mockResolvedValue({
                documents: [{ id: 'someOtherDocId' }],
            });

            const ownsDocument = await doesPatientOwnDocument(
                userId,
                documentId,
            );

            expect(ownsDocument).toBe(false);
        });
    });

    describe('getDocument', () => {
        const documentId = 'doc456';
        const displayName = 'Test Document';
        it('should return the requested document', async () => {
            const mockDocument = {
                id: documentId,
                display_name: displayName,
                file_content_type: 'application/pdf',
                expiring_url: 'http://example.com/doc',
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                document: mockDocument,
            });

            const document = await getDocument(documentId);

            expect(document).toEqual(mockDocument);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    id: documentId,
                },
            );
        });
    });

    describe('createDocument', () => {
        const userId = 'user123';
        const documentId = 'doc456';
        const displayName = 'Test Document';
        const fileString = 'base64string';
        it('should create a document and return its details', async () => {
            const mockCreatedDocument = {
                id: documentId,
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                createDocument: { document: mockCreatedDocument },
            });

            const document = await createDocument(
                userId,
                displayName,
                fileString,
            );

            expect(document).toEqual(mockCreatedDocument);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    file_string: fileString,
                    display_name: displayName,
                    rel_user_id: userId,
                    share_with_rel: true,
                },
            );
        });
    });

    describe('deleteDocument', () => {
        const documentId = 'doc456';
        it('should delete the specified document and return its details', async () => {
            const mockDeletedDocument = {
                id: documentId,
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                deleteDocument: { document: mockDeletedDocument },
            });

            const document = await deleteDocument(documentId);

            expect(document).toEqual(mockDeletedDocument);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    id: documentId,
                },
            );
        });
    });

    describe('createApiKeyForUser', () => {
        const userId = 'user123';
        it('should create an API key for the specified user and return it', async () => {
            const mockApiKey = {
                api_key: 'abc123xyz',
                messages: [],
            };

            mockGraphQLClient.prototype.request.mockResolvedValue({
                createApiKey: mockApiKey,
            });

            const apiKey = await createApiKeyForUser(userId);

            expect(apiKey).toEqual(mockApiKey);
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.any(String),
                {
                    user_id: userId,
                },
            );
        });
    });

    describe('healthieProxyRequest', () => {
        const apiKey = 'testApiKey';
        const mockQuery = `
        query TestQuery {
            testField
        }
    `;
        const mockVariables = { testVariable: 'value' };
        const mockResponseData = { data: { testField: 'testValue' } };

        it('should proxy a single GraphQL request and return the response', async () => {
            mockGraphQLClient.prototype.request.mockResolvedValue(
                mockResponseData,
            );

            const body = {
                query: mockQuery,
                variables: mockVariables,
            };

            const response = await healthieProxyRequest(body, apiKey);

            expect(response).toEqual({
                data: { data: mockResponseData },
                status: 200,
            });
            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                mockQuery,
                mockVariables,
            );
        });

        it('should proxy a batch of GraphQL requests and return the responses', async () => {
            const mockBatchResponseData: any = [
                { data: { testField: 'testValue1' } },
                { data: { testField: 'testValue2' } },
            ];
            mockGraphQLClient.prototype.batchRequests.mockResolvedValue(
                mockBatchResponseData,
            );

            const body = [
                { query: mockQuery, variables: mockVariables },
                { query: mockQuery, variables: mockVariables },
            ];

            const response = await healthieProxyRequest(body, apiKey);

            expect(response).toEqual({
                status: 200,
                data: mockBatchResponseData,
            });
            expect(
                mockGraphQLClient.prototype.batchRequests,
            ).toHaveBeenCalledWith(body);
        });

        it('should handle errors and return a proper error response', async () => {
            const errorMessage = 'Test error message';
            const errorResponse = {
                response: {
                    status: 400,
                },
                message: errorMessage,
            };
            mockGraphQLClient.prototype.request.mockRejectedValue(
                errorResponse,
            );

            const body = {
                query: mockQuery,
                variables: mockVariables,
            };

            const response = await healthieProxyRequest(body, apiKey);

            expect(response).toEqual({
                status: 400,
                data: { message: errorMessage },
            });
        });

        it('should return a 500 status code when error response is undefined', async () => {
            const errorMessage = 'Test error message';
            const errorResponse = {
                message: errorMessage,
            };
            mockGraphQLClient.prototype.request.mockRejectedValue(
                errorResponse,
            );

            const body = {
                query: mockQuery,
                variables: mockVariables,
            };

            const response = await healthieProxyRequest(body, apiKey);

            expect(response).toEqual({
                status: 500,
                data: { message: errorMessage },
            });
        });
    });

    describe('createPaymentDetails', () => {
        it('should create payment details and return the result', async () => {
            const patientId = 'patient123';
            const token = 'token456';
            const cardTypeLabel = 'Visa';
            const mockResponse = {
                createStripeCustomerDetail: {
                    stripe_customer_detail: {
                        id: 'stripeDetailId789',
                    },
                },
            };

            mockGraphQLClient.prototype.request.mockResolvedValue(mockResponse);

            const result = await createPaymentDetails(
                patientId,
                token,
                cardTypeLabel,
            );

            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    user_id: patientId,
                    token: token,
                    card_type_label: cardTypeLabel,
                },
            );
            expect(result).toEqual(
                mockResponse.createStripeCustomerDetail.stripe_customer_detail,
            );
        });

        it('should handle errors and throw an exception', async () => {
            const patientId = 'patient123';
            const token = 'token456';
            const errorMessage = 'Error creating payment details';
            mockGraphQLClient.prototype.request.mockRejectedValue(
                new Error(errorMessage),
            );

            await expect(
                createPaymentDetails(patientId, token),
            ).rejects.toThrow(errorMessage);
        });
    });

    describe('updatePaymentDetails', () => {
        it('should update payment details with card type label and isDefault flag and return the result', async () => {
            const patientId = 'patient123';
            const paymentDetailId = 'paymentDetail456';
            const cardTypeLabel = 'MasterCard';
            const isDefault = true;
            const mockResponse = {
                updateStripeCustomerDetail: {
                    stripe_customer_detail: {
                        id: 'stripeDetailId789',
                    },
                },
            };

            mockGraphQLClient.prototype.request.mockResolvedValue(mockResponse);

            const result = await updatePaymentDetails(
                patientId,
                paymentDetailId,
                cardTypeLabel,
                isDefault,
            );

            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    user_id: patientId,
                    id: paymentDetailId,
                    card_type_label: cardTypeLabel,
                    is_default: isDefault,
                },
            );
            expect(result).toEqual(
                mockResponse.updateStripeCustomerDetail.stripe_customer_detail,
            );
        });

        it('should update payment details without optional parameters and return the result', async () => {
            const patientId = 'patient123';
            const paymentDetailId = 'paymentDetail456';
            const mockResponse = {
                updateStripeCustomerDetail: {
                    stripe_customer_detail: {
                        id: 'stripeDetailId789',
                    },
                },
            };

            mockGraphQLClient.prototype.request.mockResolvedValue(mockResponse);

            const result = await updatePaymentDetails(
                patientId,
                paymentDetailId,
            );

            expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
                expect.anything(),
                {
                    user_id: patientId,
                    id: paymentDetailId,
                },
            );
            expect(result).toEqual(
                mockResponse.updateStripeCustomerDetail.stripe_customer_detail,
            );
        });

        it('should handle errors and throw an exception', async () => {
            const patientId = 'patient123';
            const paymentDetailId = 'paymentDetail456';
            const errorMessage = 'Error updating payment details';
            mockGraphQLClient.prototype.request.mockRejectedValue(
                new Error(errorMessage),
            );

            await expect(
                updatePaymentDetails(patientId, paymentDetailId),
            ).rejects.toThrow(errorMessage);
        });
    });

    it('should delete payment details and return the result', async () => {
        const patientId = 'patient123';
        const paymentDetailId = 'paymentDetail456';
        const mockResponse = {
            deleteStripeCustomerDetail: {
                stripe_customer_detail: {
                    id: 'stripeDetailId789',
                },
            },
        };

        mockGraphQLClient.prototype.request.mockResolvedValue(mockResponse);

        const result = await deletePaymentDetails(patientId, paymentDetailId);

        expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
            expect.anything(),
            {
                user_id: patientId,
                card_id: paymentDetailId,
            },
        );
        expect(result).toEqual(
            mockResponse.deleteStripeCustomerDetail.stripe_customer_detail,
        );
    });

    it('should handle errors when deleting payment details and throw an exception', async () => {
        const patientId = 'patient123';
        const paymentDetailId = 'paymentDetail456';
        const errorMessage = 'Error deleting payment details';
        mockGraphQLClient.prototype.request.mockRejectedValue(
            new Error(errorMessage),
        );

        await expect(
            deletePaymentDetails(patientId, paymentDetailId),
        ).rejects.toThrow(errorMessage);
    });

    it('should list payment details for a patient', async () => {
        const patientId = 'patient123';
        const mockResponse = {
            stripeCustomerDetails: [
                {
                    id: 'stripeDetailId789',
                    card_type: 'Visa',
                    card_type_label: 'Visa',
                    country: 'US',
                    expiration: '12/24',
                    expiring_next_month: false,
                    last_four: '4242',
                    source_status: 'active',
                    source_type: 'card',
                    stripe_id: 'cus_Hb8wzpDoeKb8Qn',
                    zip: '12345',
                },
            ],
        };

        mockGraphQLClient.prototype.request.mockResolvedValue(mockResponse);

        const result = await listPaymentDetails(patientId);

        expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
            expect.anything(),
            {
                user_id: patientId,
            },
        );
        expect(result).toEqual(mockResponse.stripeCustomerDetails);
    });

    it('should handle errors when listing payment details and throw an exception', async () => {
        const patientId = 'patient123';
        const errorMessage = 'Error retrieving payment details';
        mockGraphQLClient.prototype.request.mockRejectedValue(
            new Error(errorMessage),
        );

        await expect(listPaymentDetails(patientId)).rejects.toThrow(
            errorMessage,
        );
    });

    it('should confirm patient owns a payment detail', async () => {
        const patientId = 'patient123';
        const paymentDetailId = 'stripeDetailId789';
        const mockResponse = {
            stripeCustomerDetails: [
                {
                    id: paymentDetailId,
                    // Other properties are not relevant for this test
                },
                // ... potentially more items
            ],
        };

        mockGraphQLClient.prototype.request.mockResolvedValue(mockResponse);

        const result = await doesPatientOwnPaymentDetails(
            patientId,
            paymentDetailId,
        );

        expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
            expect.anything(),
            {
                user_id: patientId,
            },
        );
        expect(result).toBe(true);
    });

    it('should confirm patient does not own a payment detail', async () => {
        const patientId = 'patient123';
        const paymentDetailId = 'stripeDetailId789';
        const mockResponse = {
            stripeCustomerDetails: [
                {
                    id: 'someOtherPaymentDetailId',
                    // Other properties are not relevant for this test
                },
                // ... potentially more items
            ],
        };

        mockGraphQLClient.prototype.request.mockResolvedValue(mockResponse);

        const result = await doesPatientOwnPaymentDetails(
            patientId,
            paymentDetailId,
        );

        expect(mockGraphQLClient.prototype.request).toHaveBeenCalledWith(
            expect.anything(),
            {
                user_id: patientId,
            },
        );
        expect(result).toBe(false);
    });

    it('should handle errors when checking ownership of a payment detail and throw an exception', async () => {
        const patientId = 'patient123';
        const paymentDetailId = 'stripeDetailId789';
        const errorMessage = 'Error checking payment detail ownership';
        mockGraphQLClient.prototype.request.mockRejectedValue(
            new Error(errorMessage),
        );

        await expect(
            doesPatientOwnPaymentDetails(patientId, paymentDetailId),
        ).rejects.toThrow(errorMessage);
    });
});
