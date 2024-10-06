import { completeRegistrationWebhook } from './webhook';
import { createReferral } from '@eddii-backend/dal';
import { getSecret } from '@eddii-backend/secrets';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/secrets');

describe('completeRegistrationWebhook', () => {
    let mockRequest;
    let mockResponse;
    let statusSpy;
    let jsonSpy;

    beforeEach(() => {
        statusSpy = jest.fn().mockReturnThis();
        jsonSpy = jest.fn().mockReturnThis();
        mockRequest = {
            body: null,
            headers: {},
        };
        mockResponse = {
            status: statusSpy,
            json: jsonSpy,
        };
        jest.clearAllMocks();
        process.env['ENV'] = 'dev';
    });

    it('should return 400 if request body is missing', async () => {
        await completeRegistrationWebhook(mockRequest, mockResponse);
        expect(statusSpy).toHaveBeenCalledWith(400);
        expect(jsonSpy).toHaveBeenCalledWith({ error: 'Missing body.' });
    });

    it('should return 202 if event name is not COMPLETE_REGISTRATION', async () => {
        mockRequest.body = { name: 'OTHER_EVENT' };
        await completeRegistrationWebhook(mockRequest, mockResponse);
        expect(statusSpy).toHaveBeenCalledWith(202);
        expect(jsonSpy).toHaveBeenCalledWith({ message: 'Acknowledged' });
    });

    // Add more tests here to cover the other branches of the function
    // For example, test for different stages, invalid emails, unauthorized access, etc.

    it('should return 202 if stage does not match ENV variable', async () => {
        process.env['ENV'] = 'prod';
        mockRequest.body = {
            name: 'COMPLETE_REGISTRATION',
            last_attributed_touch_data: { stage: 'dev' },
        };
        await completeRegistrationWebhook(mockRequest, mockResponse);
        expect(statusSpy).toHaveBeenCalledWith(202);
        expect(jsonSpy).toHaveBeenCalledWith({ message: 'Acknowledged' });
    });

    it('should return 202 if feature is not referrals', async () => {
        mockRequest.body = {
            name: 'COMPLETE_REGISTRATION',
            last_attributed_touch_data: {
                '~feature': 'other_feature',
                stage: 'dev',
            },
        };
        await completeRegistrationWebhook(mockRequest, mockResponse);
        expect(statusSpy).toHaveBeenCalledWith(202);
        expect(jsonSpy).toHaveBeenCalledWith({ message: 'Acknowledged' });
    });

    it('should return 401 if authorization header does not match branch secret', async () => {
        (getSecret as jest.Mock).mockResolvedValue('secret');
        mockRequest.headers['x-branch-auth'] = 'invalid_secret';
        mockRequest.body = {
            name: 'COMPLETE_REGISTRATION',
            last_attributed_touch_data: {
                '~feature': 'referrals',
                stage: 'dev',
            },
        };
        await completeRegistrationWebhook(mockRequest, mockResponse);
        expect(statusSpy).toHaveBeenCalledWith(401);
        expect(jsonSpy).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 202 if referredEmail is the same as referringEmail after normalization', async () => {
        (getSecret as jest.Mock).mockResolvedValue('secret');
        mockRequest.headers['x-branch-auth'] = 'secret';
        mockRequest.body = {
            name: 'COMPLETE_REGISTRATION',
            user_data: { developer_identity: 'test@example.com' },
            last_attributed_touch_data: {
                referringEmail: 'test@example.com',
                '~feature': 'referrals',
                stage: 'dev',
            },
        };
        await completeRegistrationWebhook(mockRequest, mockResponse);
        expect(statusSpy).toHaveBeenCalledWith(202);
        expect(jsonSpy).toHaveBeenCalledWith({ message: 'Acknowledged' });
    });

    it('should return 200 and create referral on successful referral creation', async () => {
        (getSecret as jest.Mock).mockResolvedValue('secret');
        mockRequest.headers['x-branch-auth'] = 'secret';
        mockRequest.body = {
            name: 'COMPLETE_REGISTRATION',
            user_data: { developer_identity: 'referred@example.com' },
            last_attributed_touch_data: {
                referringEmail: 'referring@example.com',
                '~feature': 'referrals',
                stage: 'dev',
            },
        };
        await completeRegistrationWebhook(mockRequest, mockResponse);
        expect(createReferral).toHaveBeenCalledWith(
            'referring@example.com',
            'referred@example.com',
        );
        expect(statusSpy).toHaveBeenCalledWith(200);
        expect(jsonSpy).toHaveBeenCalledWith({ message: 'Acknowledged' });
    });

    it('should return 500 if there is an error creating the referral', async () => {
        (createReferral as jest.Mock).mockRejectedValue(
            new Error('Error creating referral.'),
        );
        (getSecret as jest.Mock).mockResolvedValue('secret');
        mockRequest.headers['x-branch-auth'] = 'secret';
        mockRequest.body = {
            name: 'COMPLETE_REGISTRATION',
            user_data: { developer_identity: 'referred@example.com' },
            last_attributed_touch_data: {
                referringEmail: 'referring@example.com',
                '~feature': 'referrals',
                stage: 'dev',
            },
        };
        await completeRegistrationWebhook(mockRequest, mockResponse);
        expect(statusSpy).toHaveBeenCalledWith(500);
        expect(jsonSpy).toHaveBeenCalledWith({
            error: 'Error creating referral.',
        });
    });
});
