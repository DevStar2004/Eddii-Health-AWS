import {
    PostConfirmationConfirmForgotPassword,
    PostConfirmationConfirmSignUpTriggerEvent,
} from 'aws-lambda';
import { User, createUser, createUserTopic, getUser } from '@eddii-backend/dal';
import { handler } from './post-confirmation';

jest.mock('@eddii-backend/dal');

describe('post-confirmation handler', () => {
    const mockEvent: PostConfirmationConfirmSignUpTriggerEvent = {
        version: '1',
        region: 'us-east-1',
        userPoolId: 'us-east-1_123456789',
        userName: 'johndoe',
        callerContext: {
            awsSdkVersion: '1.0.0',
            clientId: '123456789',
        },
        request: {
            userAttributes: {
                sub: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                email: 'johndoe@example.com',
                nickname: 'johndoe',
                locale: 'en-US',
                zoneinfo: 'America/New_York',
            },
        },
        response: {},
        triggerSource: 'PostConfirmation_ConfirmSignUp',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new user', async () => {
        const mockUser = new User(
            'johndoe@example.com',
            'johndoe',
            'en-US',
            'America/New_York',
        );

        await handler(mockEvent);

        expect(createUser).toHaveBeenCalledWith(mockUser);
        expect(createUserTopic).toHaveBeenCalledWith('johndoe@example.com');
    });

    it('should skip for existing user', async () => {
        (getUser as jest.Mock).mockResolvedValue({
            email: 'johndoe@example.com',
        });
        await handler(mockEvent);
        expect(createUser).not.toHaveBeenCalled();
        expect(createUserTopic).not.toHaveBeenCalled();
    });

    it('should skip for non new user', async () => {
        const mockForgotEvent: PostConfirmationConfirmForgotPassword = {
            version: '1',
            region: 'us-east-1',
            userPoolId: 'us-east-1_123456789',
            userName: 'johndoe',
            callerContext: {
                awsSdkVersion: '1.0.0',
                clientId: '123456789',
            },
            request: {
                userAttributes: {
                    sub: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                    email: 'johndoe@example.com',
                    nickname: 'johndoe',
                    locale: 'en-US',
                    zoneinfo: 'America/New_York',
                },
            },
            response: {},
            triggerSource: 'PostConfirmation_ConfirmForgotPassword',
        };
        await handler(mockForgotEvent);
        expect(createUser).not.toHaveBeenCalled();
        expect(createUserTopic).not.toHaveBeenCalled();
    });
});
