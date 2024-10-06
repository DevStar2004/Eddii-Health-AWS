import {
    publishPushNotificationToUserTopicArn,
    sendLowAlertVoiceMessage,
} from './notifications';
import Clients from '@eddii-backend/clients';

jest.mock('@aws-sdk/client-pinpoint-sms-voice-v2');
jest.mock('@aws-sdk/client-sns');

describe('publishPushNotificationToUserTopicArn', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should publish a notification to the specified user topic ARN', async () => {
        const userTopicArn = 'arn:aws:sns:us-east-1:123456789012:my-topic';
        const title = 'Title';
        const message = 'Hello, world!';
        const collapseKey = 'my-collapse-key';

        const publishMock = (Clients.sns.send as jest.Mock).mockResolvedValue(
            {},
        );

        // Call the function and wait for it to complete
        await publishPushNotificationToUserTopicArn(
            userTopicArn,
            title,
            message,
            collapseKey,
        );

        // Verify that the PublishCommand was created with the correct parameters
        expect(publishMock).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if there was an error publishing the notification', async () => {
        const userTopicArn = 'arn:aws:sns:us-east-1:123456789012:my-topic';
        const title = 'Title';
        const message = 'Hello, world!';
        const collapseKey = 'my-collapse-key';

        const publishMock = (Clients.sns.send as jest.Mock).mockRejectedValue(
            new Error('Test error'),
        );

        // Call the function and expect it to throw an error
        await expect(
            publishPushNotificationToUserTopicArn(
                userTopicArn,
                title,
                message,
                collapseKey,
            ),
        ).rejects.toThrow('Error publishing push notifcation.');
        expect(publishMock).toHaveBeenCalledTimes(1);
    });
});

describe('sendLowAlertVoiceMessage', () => {
    let mockSend: jest.Mock;
    const originationNumber = 'test_number';
    const phoneNumber = '1234567890';

    beforeEach(() => {
        jest.clearAllMocks();
        mockSend = (Clients.pinpoint.send as jest.Mock).mockResolvedValue({});
    });

    it('should send a voice message when origination number is set', async () => {
        process.env['PINPOINT_ORIGINATION_NUMBER'] = originationNumber;

        await sendLowAlertVoiceMessage(phoneNumber);

        expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should not send a voice message if origination number is not set', async () => {
        process.env['PINPOINT_ORIGINATION_NUMBER'] = '';

        await sendLowAlertVoiceMessage(phoneNumber);

        expect(mockSend).not.toHaveBeenCalled();
    });

    it('should throw an error when sending fails', async () => {
        process.env['PINPOINT_ORIGINATION_NUMBER'] = originationNumber;
        const error = new Error('Network error');
        mockSend.mockRejectedValue(error);

        await expect(sendLowAlertVoiceMessage(phoneNumber)).rejects.toThrow(
            'Error sending voice message.',
        );

        expect(mockSend).toHaveBeenCalledTimes(1);
    });
});
