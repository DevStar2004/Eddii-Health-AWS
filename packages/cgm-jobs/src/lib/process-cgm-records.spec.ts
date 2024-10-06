import { handler } from './process-cgm-records';
import {
    Guardian,
    Session,
    SessionType,
    getUser,
    listGuardiansForUser,
    listSessionsByUserId,
} from '@eddii-backend/dal';
import {
    publishPushNotificationToUserTopicArn,
    sendHighAlertVoiceMessage,
    sendLowAlertVoiceMessage,
} from '@eddii-backend/notifications';
import { getDeviceDataFromDexcom } from '@eddii-backend/dexcom';
import Clients from '@eddii-backend/clients';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/notifications', () => ({
    ...jest.requireActual('@eddii-backend/notifications'),
    publishPushNotificationToUserTopicArn: jest.fn(),
    sendLowAlertVoiceMessage: jest.fn(),
    sendHighAlertVoiceMessage: jest.fn(),
}));

jest.mock('@eddii-backend/dexcom');

describe('handler', () => {
    let lowMockEgvsRecord: any;
    let highMockEgvsRecord: any;
    let mockUser: any;
    let mockGuardian: any;
    let mockGuardianUsers: Guardian[];
    let mockSession: Session;

    beforeEach(() => {
        lowMockEgvsRecord = {
            value: 50,
            systemTime: new Date().toISOString(),
            trend: 'flat',
        };
        highMockEgvsRecord = {
            value: 200,
            systemTime: new Date().toISOString(),
            trend: 'flat',
        };
        mockUser = {
            email: 'user@example.com',
            userTopicArn: 'arn:aws:sns:us-west-2:123456789012:user',
            glucoseAlerts: true,
            phoneNumber: '+1234567890',
            lowGlucoseAlertThreshold: 60,
            highGlucoseAlertThreshold: 130,
        };
        mockGuardian = {
            email: 'guardian@example.com',
            userTopicArn: 'arn:aws:sns:us-west-2:123456789012:guardian',
            glucoseAlerts: true,
            phoneNumber: '+1234567891',
        };
        mockGuardianUsers = [
            {
                guardianEmail: 'guardian@example.com',
                userEmail: 'user@example.com',
                lowGlucoseAlertThreshold: 60,
                highGlucoseAlertThreshold: 130,
            },
        ];
        mockSession = { email: 'user@example.com', type: SessionType.dexcom };

        jest.clearAllMocks();
    });

    it('should process CGM records and handle low alerts', async () => {
        // Mock the dependencies
        jest.mocked(getUser).mockResolvedValue(mockUser);
        jest.mocked(getUser).mockImplementation(async email => {
            if (email === mockUser.email) {
                return mockUser;
            } else if (email === mockGuardian.email) {
                return mockGuardian;
            }
            throw new Error('User not found');
        });
        jest.mocked(listGuardiansForUser).mockResolvedValue(mockGuardianUsers);
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);
        jest.mocked(getDeviceDataFromDexcom).mockResolvedValue({
            records: [
                {
                    alertSchedules: [
                        {
                            alertSettings: [
                                {
                                    alertName: 'low',
                                    enabled: true,
                                    value: 60,
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);

        // Mock the Kinesis event
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: lowMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        const response = await handler(event);

        // Assertions to verify the behavior
        expect(getUser).toHaveBeenCalledWith(mockSession.email);
        expect(listGuardiansForUser).toHaveBeenCalledWith(mockSession.email);
        expect(getDeviceDataFromDexcom).toHaveBeenCalledWith(mockSession);
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockUser.userTopicArn,
            expect.any(String),
            expect.any(String),
            'dexcom-egv-notification',
        );
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockGuardian.userTopicArn,
            expect.any(String),
            expect.any(String),
            'dexcom-egv-notification',
        );
        expect(sendLowAlertVoiceMessage).toHaveBeenCalledWith('+1234567890');
        expect(sendLowAlertVoiceMessage).toHaveBeenCalledWith(
            '+1234567891',
            true,
        );
        expect(response.batchItemFailures).toEqual([]);
    });

    it('should process CGM records and handle high alerts', async () => {
        // Mock the dependencies
        jest.mocked(getUser).mockResolvedValue(mockUser);
        jest.mocked(getUser).mockImplementation(async email => {
            if (email === mockUser.email) {
                return mockUser;
            } else if (email === mockGuardian.email) {
                return mockGuardian;
            }
            throw new Error('User not found');
        });
        jest.mocked(listGuardiansForUser).mockResolvedValue(mockGuardianUsers);
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);
        jest.mocked(getDeviceDataFromDexcom).mockResolvedValue({
            records: [
                {
                    alertSchedules: [
                        {
                            alertSettings: [
                                {
                                    alertName: 'high',
                                    enabled: true,
                                    value: 100,
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);

        // Mock the Kinesis event
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: highMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        const response = await handler(event);

        // Assertions to verify the behavior
        expect(getUser).toHaveBeenCalledWith(mockSession.email);
        expect(listGuardiansForUser).toHaveBeenCalledWith(mockSession.email);
        expect(getDeviceDataFromDexcom).toHaveBeenCalledWith(mockSession);
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockUser.userTopicArn,
            expect.any(String),
            expect.any(String),
            'dexcom-egv-notification',
        );
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockGuardian.userTopicArn,
            expect.any(String),
            expect.any(String),
            'dexcom-egv-notification',
        );
        expect(sendHighAlertVoiceMessage).toHaveBeenCalled();
        expect(response.batchItemFailures).toEqual([]);
    });

    it('should not send alerts if glucoseAlerts is disabled for the user', async () => {
        // Setup mock user with glucoseAlerts disabled
        mockUser.glucoseAlerts = false;

        // Mock the dependencies
        jest.mocked(getUser).mockResolvedValue(mockUser);
        jest.mocked(getUser).mockImplementation(async email => {
            if (email === mockUser.email) {
                return mockUser;
            } else if (email === mockGuardian.email) {
                return mockGuardian;
            }
            throw new Error('User not found');
        });
        jest.mocked(listGuardiansForUser).mockResolvedValue(mockGuardianUsers);
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);
        jest.mocked(getDeviceDataFromDexcom).mockResolvedValue({
            records: [
                {
                    alertSchedules: [
                        {
                            alertSettings: [
                                {
                                    alertName: 'low',
                                    enabled: true,
                                    value: 60,
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);

        // Mock the Kinesis event
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: lowMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        await handler(event);

        // Assertions to verify the behavior
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockGuardian.userTopicArn,
            expect.any(String),
            expect.any(String),
            'dexcom-egv-notification',
        );
        expect(sendLowAlertVoiceMessage).toHaveBeenCalled();
    });

    it('should not send alerts to guardian if glucoseAlerts is disabled', async () => {
        // Setup mock user with glucoseAlerts disabled
        mockGuardian.glucoseAlerts = false;

        // Mock the dependencies
        jest.mocked(getUser).mockResolvedValue(mockUser);
        jest.mocked(getUser).mockImplementation(async email => {
            if (email === mockUser.email) {
                return mockUser;
            } else if (email === mockGuardian.email) {
                return mockGuardian;
            }
            throw new Error('User not found');
        });
        jest.mocked(listGuardiansForUser).mockResolvedValue(mockGuardianUsers);
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);
        jest.mocked(getDeviceDataFromDexcom).mockResolvedValue({
            records: [
                {
                    alertSchedules: [
                        {
                            alertSettings: [
                                {
                                    alertName: 'low',
                                    enabled: true,
                                    value: 60,
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);

        // Mock the Kinesis event
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: lowMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        await handler(event);

        // Assertions to verify the behavior
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalledWith(
            mockUser.userTopicArn,
            expect.any(String),
            expect.any(String),
            'dexcom-egv-notification',
        );
        expect(sendLowAlertVoiceMessage).toHaveBeenCalled();
    });

    it('should not call to if lowGlucoseAlertThreshold is disabled', async () => {
        // Setup mock user with glucoseAlerts disabled
        mockUser.glucoseAlerts = false;
        mockUser.lowGlucoseAlertThreshold = undefined;
        mockGuardian.glucoseAlerts = false;
        mockGuardianUsers[0].lowGlucoseAlertThreshold = undefined;

        // Mock the dependencies
        jest.mocked(getUser).mockResolvedValue(mockUser);
        jest.mocked(getUser).mockImplementation(async email => {
            if (email === mockUser.email) {
                return mockUser;
            } else if (email === mockGuardian.email) {
                return mockGuardian;
            }
            throw new Error('User not found');
        });
        jest.mocked(listGuardiansForUser).mockResolvedValue(mockGuardianUsers);
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);
        jest.mocked(getDeviceDataFromDexcom).mockResolvedValue({
            records: [
                {
                    alertSchedules: [
                        {
                            alertSettings: [
                                {
                                    alertName: 'low',
                                    enabled: true,
                                    value: 60,
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);

        // Mock the Kinesis event
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: lowMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        await handler(event);

        // Assertions to verify the behavior
        expect(publishPushNotificationToUserTopicArn).not.toHaveBeenCalled();
        expect(sendLowAlertVoiceMessage).not.toHaveBeenCalled();
    });

    it('should not call to guardian if lowGlucoseAlertThreshold is disabled', async () => {
        // Setup mock user with glucoseAlerts disabled
        mockUser.glucoseAlerts = false;
        mockGuardian.glucoseAlerts = false;
        mockGuardianUsers[0].lowGlucoseAlertThreshold = undefined;

        // Mock the dependencies
        jest.mocked(getUser).mockResolvedValue(mockUser);
        jest.mocked(getUser).mockImplementation(async email => {
            if (email === mockUser.email) {
                return mockUser;
            } else if (email === mockGuardian.email) {
                return mockGuardian;
            }
            throw new Error('User not found');
        });
        jest.mocked(listGuardiansForUser).mockResolvedValue(mockGuardianUsers);
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);
        jest.mocked(getDeviceDataFromDexcom).mockResolvedValue({
            records: [
                {
                    alertSchedules: [
                        {
                            alertSettings: [
                                {
                                    alertName: 'low',
                                    enabled: true,
                                    value: 60,
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);

        // Mock the Kinesis event
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: lowMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        await handler(event);

        // Assertions to verify the behavior
        expect(publishPushNotificationToUserTopicArn).not.toHaveBeenCalled();
        expect(sendLowAlertVoiceMessage).toHaveBeenCalledWith('+1234567890');
    });

    it('should not call to guardian if highGlucoseAlertThreshold is disabled', async () => {
        // Setup mock user with glucoseAlerts disabled
        mockUser.glucoseAlerts = false;
        mockGuardian.glucoseAlerts = false;
        mockGuardianUsers[0].highGlucoseAlertThreshold = undefined;

        // Mock the dependencies
        jest.mocked(getUser).mockResolvedValue(mockUser);
        jest.mocked(getUser).mockImplementation(async email => {
            if (email === mockUser.email) {
                return mockUser;
            } else if (email === mockGuardian.email) {
                return mockGuardian;
            }
            throw new Error('User not found');
        });
        jest.mocked(listGuardiansForUser).mockResolvedValue(mockGuardianUsers);
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);
        jest.mocked(getDeviceDataFromDexcom).mockResolvedValue({
            records: [
                {
                    alertSchedules: [
                        {
                            alertSettings: [
                                {
                                    alertName: 'low',
                                    enabled: true,
                                    value: 60,
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);

        // Mock the Kinesis event
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: lowMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        await handler(event);

        // Assertions to verify the behavior
        expect(publishPushNotificationToUserTopicArn).not.toHaveBeenCalled();
        expect(sendHighAlertVoiceMessage).not.toHaveBeenCalled();
    });

    it('should not call if no phone number', async () => {
        // Setup mock user with glucoseAlerts disabled
        mockUser.glucoseAlerts = false;
        mockUser.phoneNumber = undefined;
        mockGuardian.phoneNumber = undefined;
        mockGuardianUsers[0].lowGlucoseAlertThreshold = undefined;

        // Mock the dependencies
        jest.mocked(getUser).mockResolvedValue(mockUser);
        jest.mocked(getUser).mockImplementation(async email => {
            if (email === mockUser.email) {
                return mockUser;
            } else if (email === mockGuardian.email) {
                return mockGuardian;
            }
            throw new Error('User not found');
        });
        jest.mocked(listGuardiansForUser).mockResolvedValue(mockGuardianUsers);
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);
        jest.mocked(getDeviceDataFromDexcom).mockResolvedValue({
            records: [
                {
                    alertSchedules: [
                        {
                            alertSettings: [
                                {
                                    alertName: 'low',
                                    enabled: true,
                                    value: 60,
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);

        // Mock the Kinesis event
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: lowMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        await handler(event);

        // Assertions to verify the behavior
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalled();
        expect(sendLowAlertVoiceMessage).not.toHaveBeenCalled();
    });

    it('should not call to guardian if no phone number', async () => {
        // Setup mock user with glucoseAlerts disabled
        mockUser.glucoseAlerts = false;
        mockGuardian.phoneNumber = undefined;
        mockGuardianUsers[0].lowGlucoseAlertThreshold = undefined;

        // Mock the dependencies
        jest.mocked(getUser).mockResolvedValue(mockUser);
        jest.mocked(getUser).mockImplementation(async email => {
            if (email === mockUser.email) {
                return mockUser;
            } else if (email === mockGuardian.email) {
                return mockGuardian;
            }
            throw new Error('User not found');
        });
        jest.mocked(listGuardiansForUser).mockResolvedValue(mockGuardianUsers);
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);
        jest.mocked(getDeviceDataFromDexcom).mockResolvedValue({
            records: [
                {
                    alertSchedules: [
                        {
                            alertSettings: [
                                {
                                    alertName: 'low',
                                    enabled: true,
                                    value: 60,
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);

        // Mock the Kinesis event
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: lowMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        await handler(event);

        // Assertions to verify the behavior
        expect(publishPushNotificationToUserTopicArn).toHaveBeenCalled();
        expect(sendLowAlertVoiceMessage).toHaveBeenCalledWith('+1234567890');
    });

    it('does not send notifications if the cache indicates a notification has already been sent', async () => {
        // Mock the cache to indicate that a notification has already been sent
        const mockCacheData = JSON.stringify({
            lastAlertStatus: 'low',
            lastGuardianLowAlertStatuses: { 'guardian@example.com': true },
        });
        jest.mocked(Clients.getDexcomCache).mockImplementation(
            async () =>
                ({
                    get: jest.fn().mockResolvedValue(mockCacheData),
                    set: jest.fn(),
                }) as any,
        );

        // Mock the rest of the dependencies
        jest.mocked(getUser).mockResolvedValue(mockUser);
        jest.mocked(listGuardiansForUser).mockResolvedValue(mockGuardianUsers);
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);
        jest.mocked(getDeviceDataFromDexcom).mockResolvedValue({
            records: [
                {
                    alertSchedules: [
                        {
                            alertSettings: [
                                {
                                    alertName: 'low',
                                    enabled: true,
                                    value: 60,
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);

        // Mock the Kinesis event
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: lowMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        await handler(event);

        // Assertions to verify that no new notifications are sent
        expect(publishPushNotificationToUserTopicArn).not.toHaveBeenCalled();
        expect(sendLowAlertVoiceMessage).toHaveBeenCalledWith('+1234567890');
    });

    it('should skip processing CGM records if systemTime is greater than 10 minutes old', async () => {
        // Mock the dependencies
        jest.mocked(listSessionsByUserId).mockResolvedValue([mockSession]);

        // Mock the Kinesis event with a record older than 10 minutes
        const oldRecordTime = new Date(
            Date.now() - 10 * 60 * 1000 - 1,
        ).toISOString();
        lowMockEgvsRecord.systemTime = oldRecordTime;
        const event: any = {
            Records: [
                {
                    kinesis: {
                        sequenceNumber: '123',
                        data: Buffer.from(
                            JSON.stringify({
                                userId: mockUser.email,
                                record: lowMockEgvsRecord,
                            }),
                        ).toString('base64'),
                    },
                    eventSource: 'aws:kinesis',
                    eventID: 'shardId-000000000000:123',
                    eventName: 'aws:kinesis:record',
                    invokeIdentityArn: 'arn:aws:iam::123456789012:role/test',
                    awsRegion: 'us-west-2',
                    eventVersion: '1.0',
                },
            ],
        };

        // Call the handler with the mock event
        await handler(event);

        // Assertions to verify that processCgmRecord is not called
        expect(listSessionsByUserId).not.toHaveBeenCalled();
    });
});
