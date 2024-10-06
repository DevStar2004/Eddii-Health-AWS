import {
    deleteUserData,
    deleteUserTopic,
    getSession,
    getUser,
} from '@eddii-backend/dal';
import { deleteUser } from './user-deletion';
import Clients from '@eddii-backend/clients';
import { setStreamingStateFromDexcom } from '@eddii-backend/dexcom';
import { getSecret } from '@eddii-backend/secrets';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/dexcom');
jest.mock('@eddii-backend/secrets');

describe('deleteUser', () => {
    const email = 'test@example.com';
    const userNames = {
        Users: [{ Username: 'testuser1' }, { Username: 'testuser2' }],
    };
    const user = {
        email: 'test@example.com',
        userTopicArn: 'arn:aws:sns:us-east-1:123456789012:user-topic',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should disable and delete Cognito users, disable Dexcom session, delete user data and topic', async () => {
        process.env['DEXCOM_STREAMING_ENABLED'] = 'true';
        process.env['COGNITO_USER_POOL_ID'] = 'Test';

        (Clients.cognito.listUsers as jest.Mock).mockResolvedValue(userNames);
        (Clients.cognito.adminDisableUser as jest.Mock).mockResolvedValue({});
        (Clients.cognito.adminDeleteUser as jest.Mock).mockResolvedValue({});
        (getSecret as jest.Mock).mockResolvedValue('test');
        (getUser as jest.Mock).mockResolvedValue(user);
        (getSession as jest.Mock).mockResolvedValue({});
        (setStreamingStateFromDexcom as jest.Mock).mockResolvedValue({});
        (deleteUserData as jest.Mock).mockResolvedValue({});
        (deleteUserTopic as jest.Mock).mockResolvedValue({});

        await deleteUser(email);

        expect(Clients.cognito.listUsers).toHaveBeenCalledWith({
            UserPoolId: expect.any(String),
            Filter: `email = "${email}"`,
        });
        for (const userName of userNames.Users) {
            expect(Clients.cognito.adminDisableUser).toHaveBeenCalledWith({
                Username: userName.Username,
                UserPoolId: expect.any(String),
            });
            expect(Clients.cognito.adminDeleteUser).toHaveBeenCalledWith({
                Username: userName.Username,
                UserPoolId: expect.any(String),
            });
        }
        expect(getUser).toHaveBeenCalled();
        expect(getSession).toHaveBeenCalled();
        expect(setStreamingStateFromDexcom).toHaveBeenCalled();
        expect(deleteUserData).toHaveBeenCalled();
        expect(deleteUserTopic).toHaveBeenCalled();
    });

    it('should log an error if deleting user data fails', async () => {
        process.env['DEXCOM_STREAMING_ENABLED'] = 'true';
        process.env['COGNITO_USER_POOL_ID'] = 'Test';

        const error = new Error('Error deleting user data');
        (Clients.cognito.listUsers as jest.Mock).mockResolvedValue(userNames);
        (Clients.cognito.adminDisableUser as jest.Mock).mockResolvedValue({});
        (Clients.cognito.adminDeleteUser as jest.Mock).mockResolvedValue({});
        (getSecret as jest.Mock).mockResolvedValue('test');
        (getUser as jest.Mock).mockResolvedValue(user);
        (getSession as jest.Mock).mockResolvedValue({});
        (setStreamingStateFromDexcom as jest.Mock).mockResolvedValue({});
        (deleteUserData as jest.Mock).mockRejectedValue(error);
        (deleteUserTopic as jest.Mock).mockResolvedValue({});

        const consoleSpy = jest.spyOn(console, 'error');

        await expect(deleteUser(email)).rejects.toThrow(error);

        expect(consoleSpy).toHaveBeenCalledWith(
            `Error deleting user with email: ${email}`,
            error,
        );

        consoleSpy.mockRestore();
    });

    it('should log an error if deleting user topic fails', async () => {
        process.env['DEXCOM_STREAMING_ENABLED'] = 'true';
        process.env['COGNITO_USER_POOL_ID'] = 'Test';

        const error = new Error('Error deleting user topic');
        (Clients.cognito.listUsers as jest.Mock).mockResolvedValue(userNames);
        (Clients.cognito.adminDisableUser as jest.Mock).mockResolvedValue({});
        (Clients.cognito.adminDeleteUser as jest.Mock).mockResolvedValue({});
        (getSecret as jest.Mock).mockResolvedValue('test');
        (getUser as jest.Mock).mockResolvedValue(user);
        (getSession as jest.Mock).mockResolvedValue({});
        (setStreamingStateFromDexcom as jest.Mock).mockResolvedValue({});
        (deleteUserData as jest.Mock).mockResolvedValue({});
        (deleteUserTopic as jest.Mock).mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, 'error');

        await expect(deleteUser(email)).rejects.toThrow(error);

        expect(consoleSpy).toHaveBeenCalledWith(
            `Error deleting user with email: ${email}`,
            error,
        );

        consoleSpy.mockRestore();
    });
});
