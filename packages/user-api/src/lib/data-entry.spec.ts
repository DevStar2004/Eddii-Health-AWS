import { listDataEntries, putDataEntry } from './data-entry';
import {
    User,
    addHeartsForUser,
    getUser,
    upsertDataEntry,
} from '@eddii-backend/dal';

jest.mock('@eddii-backend/dal');

let mockRequest = {} as any;
let mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
} as any;

beforeEach(() => {
    mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
});
afterEach(() => {
    jest.resetAllMocks();
});
describe('data-entry Module', () => {
    //putDataEntry API testcase
    describe('Put data entry', () => {
        it('Should through 400 when entryAt is invalid or Empty', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {
                    dataEntryType: 'foods',
                },
                body: {
                    entryAt: 'Invalid',
                },
            };

            await putDataEntry(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid entryAt time format.',
            });
        });

        it('Should through 400 when dataEntryType is Empty', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {},
                body: {},
            };

            await putDataEntry(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Data entry type is required.',
            });
        });

        it('Should through 400 when dataEntryType is Invlid', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {
                    dataEntryType: 'Invalid',
                },
                body: {},
            };

            await putDataEntry(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid data entry type.',
            });
        });

        it('Should Put data entry for dataEntryType foods and return 200', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {
                    dataEntryType: 'foods',
                },
                body: {
                    entryAt: '2022-04-06T00:00:00.000Z',
                    foods: [
                        {
                            foodName: 'testFood',
                            macros: 'testMacros',
                            description: 'testDescription',
                        },
                    ],
                },
            };
            (upsertDataEntry as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                entryAt: mockRequest.body.entryAt,
                dataEntries: [
                    {
                        foodName: 'testFood',
                        macros: 'testMacros',
                        description: 'testDescription',
                    },
                ],
            });
            (getUser as jest.Mock).mockResolvedValue(
                new User(mockRequest.email),
            );
            (addHeartsForUser as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                1: 1,
            });

            await putDataEntry(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                dataEntry: {
                    email: 'test@gmail.com',
                    entryAt: '2022-04-06T00:00:00.000Z',
                    dataEntries: [
                        {
                            foodName: 'testFood',
                            macros: 'testMacros',
                            description: 'testDescription',
                        },
                    ],
                },
                user: { '1': 1, email: 'test@gmail.com' },
            });
        });

        it('Should through 400 when food is Invlid', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {
                    dataEntryType: 'foods',
                },
                body: {
                    entryAt: '2022-04-06T00:00:00.000Z',
                    foods: [
                        {
                            foodName: '   ',
                        },
                    ],
                },
            };
            (getUser as jest.Mock).mockResolvedValue(
                new User(mockRequest.userEmail),
            );

            await putDataEntry(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid food.',
            });
        });

        it('Should Put data entry for dataEntryType feelings and return 200', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {
                    dataEntryType: 'feelings',
                },
                body: {
                    entryAt: '2022-04-06T00:00:00.000Z',
                    feelings: [
                        {
                            feeling: 'happy',
                            description: 'testDescription',
                        },
                    ],
                },
            };
            (upsertDataEntry as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                entryAt: mockRequest.body.entryAt,
                dataEntries: [
                    {
                        feeling: 'happy',
                        description: 'testDescription',
                    },
                ],
            });
            (getUser as jest.Mock).mockResolvedValue(
                new User(mockRequest.email),
            );
            (addHeartsForUser as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                1: 1,
            });

            await putDataEntry(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                dataEntry: {
                    email: 'test@gmail.com',
                    entryAt: '2022-04-06T00:00:00.000Z',
                    dataEntries: [
                        {
                            feeling: 'happy',
                            description: 'testDescription',
                        },
                    ],
                },
                user: { '1': 1, email: 'test@gmail.com' },
            });
        });

        it('Should through 400 when feelings is Invlid', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {
                    dataEntryType: 'feelings',
                },
                body: {
                    entryAt: '2022-04-06T00:00:00.000Z',
                    feelings: [
                        {
                            feeling: 'Invalid',
                            description: 'testDescription',
                        },
                    ],
                },
            };
            (getUser as jest.Mock).mockResolvedValue(
                new User(mockRequest.userEmail),
            );

            await putDataEntry(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid feeling.',
            });
        });

        it('Should Put data entry for dataEntryType medicines and return 200', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {
                    dataEntryType: 'medicines',
                },
                body: {
                    entryAt: '2022-04-06T00:00:00.000Z',
                    medicines: [
                        {
                            medicineType: 'testType',
                            medicineName: 'testName',
                            amount: 200,
                        },
                    ],
                },
            };
            (upsertDataEntry as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                entryAt: mockRequest.body.entryAt,
                dataEntries: [
                    {
                        medicineType: 'testType',
                        medicineName: 'testName',
                        amount: 200,
                    },
                ],
            });
            (getUser as jest.Mock).mockResolvedValue(
                new User(mockRequest.email),
            );
            (addHeartsForUser as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                1: 1,
            });

            await putDataEntry(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                dataEntry: {
                    email: 'test@gmail.com',
                    entryAt: '2022-04-06T00:00:00.000Z',
                    dataEntries: [
                        {
                            medicineType: 'testType',
                            medicineName: 'testName',
                            amount: 200,
                        },
                    ],
                },
                user: { '1': 1, email: 'test@gmail.com' },
            });
        });

        it('Should through 400 when medicines is Invlid', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {
                    dataEntryType: 'medicines',
                },
                body: {
                    entryAt: '2022-04-06T00:00:00.000Z',
                    medicines: [
                        {
                            medicineType: 'testType',
                            medicineName: 'testName',
                            amount: '200',
                        },
                    ],
                },
            };
            (getUser as jest.Mock).mockResolvedValue(
                new User(mockRequest.userEmail),
            );

            await putDataEntry(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid medicine.',
            });
        });

        it('Should Put data entry for dataEntryType exercises and return 200', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {
                    dataEntryType: 'exercises',
                },
                body: {
                    entryAt: '2022-04-06T00:00:00.000Z',
                    exercises: [
                        {
                            exerciseTime: 'testTime',
                            exerciseName: 'testName',
                        },
                    ],
                },
            };
            (upsertDataEntry as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                entryAt: mockRequest.body.entryAt,
                dataEntries: [
                    {
                        exerciseTime: 'testTime',
                        exerciseName: 'testName',
                    },
                ],
            });
            (getUser as jest.Mock).mockResolvedValue(
                new User(mockRequest.email),
            );
            (addHeartsForUser as jest.Mock).mockResolvedValue({
                email: mockRequest.userEmail,
                1: 1,
            });

            await putDataEntry(mockRequest, mockResponse);

            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                dataEntry: {
                    email: 'test@gmail.com',
                    entryAt: '2022-04-06T00:00:00.000Z',
                    dataEntries: [
                        {
                            exerciseTime: 'testTime',
                            exerciseName: 'testName',
                        },
                    ],
                },
                user: { '1': 1, email: 'test@gmail.com' },
            });
        });

        it('Should through 400 when exercises is Invlid', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                params: {
                    dataEntryType: 'exercises',
                },
                body: {
                    entryAt: '2022-04-06T00:00:00.000Z',
                    exercises: [
                        {
                            exerciseTime: 'testTime',
                            exerciseName: 'testName',
                        },
                    ],
                },
            };
            (getUser as jest.Mock).mockResolvedValue(
                new User(mockRequest.userEmail),
            );

            await putDataEntry(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid exercise.',
            });
        });
    });

    //listDataEntries API testcase
    describe('list data entry', () => {
        let mockRequest = {} as any;
        let mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as any;

        beforeEach(() => {
            mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
            };
        });
        afterEach(() => {
            jest.resetAllMocks();
        });

        it('Should through 400 when startTimestamp is Empty', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                query: {
                    startTimestamp: null,
                },
            };

            await listDataEntries(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'StartTimestamp is required.',
            });
        });

        it('Should through 400 when EndTimestamp is Empty', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                query: {
                    startTimestamp: '2022-04-06T00:00:00.000Z',
                    endTimestamp: null,
                },
            };

            await listDataEntries(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'EndTimestamp is required.',
            });
        });

        it('Should through 400 when startTimestamp is Invlid', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                query: {
                    startTimestamp: 'Invalid',
                    endTimestamp: 'Invalid',
                },
            };

            await listDataEntries(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid StartTimestamp time format.',
            });
        });

        it('Should through 400 when EndTimestamp is Invlid', async () => {
            mockRequest = {
                userEmail: 'test@gmail.com',
                query: {
                    startTimestamp: '2023-09-14T12:30:00.000Z',
                    endTimestamp: 'Invalid',
                },
            };

            await listDataEntries(mockRequest, mockResponse);
            // Expectations
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invalid EndTimestamp time format.',
            });
        });

        // it('Should list data entries', async () => {
        //     mockRequest = {
        //         userEmail: 'test@gmail.com',
        //         query: {
        //             startTimestamp: '2023-09-14T12:30:00.000Z',
        //             endTimestamp: '2023-09-14T12:30:00.000Z',
        //             page: '5'
        //         },
        //         multiValueQuery: {
        //             filters: ['filter1']
        //         }
        //     };

        //     (listDataEntriesFromDal as jest.Mock).mockResolvedValue(
        //         {
        //             email: mockRequest.userEmail,
        //             startTimestamp: mockRequest.query.startTimestamp,
        //             endTimestamp: mockRequest.query.endTimestamp,
        //             page: mockRequest.query.page,
        //             filters: mockRequest.multiValueQuery.filters,
        //         }
        //     );
        //     await listDataEntries(mockRequest, mockResponse);
        //     // Expectations

        //     // expect(mockResponse.json).toHaveBeenCalledWith({
        //     //     message: 'Invalid data entry type.',
        //     // });
        // });
    });
});
