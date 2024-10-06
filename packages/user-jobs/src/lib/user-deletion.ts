import {
    OAuthSession,
    SessionType,
    deleteUserData,
    deleteUserTopic,
    getSession,
    getUser,
} from '@eddii-backend/dal';
import Clients from '@eddii-backend/clients';
import { setStreamingStateFromDexcom } from '@eddii-backend/dexcom';

export const deleteUser = async (email: string): Promise<void> => {
    try {
        const userNames = await Clients.cognito.listUsers({
            UserPoolId: process.env['COGNITO_USER_POOL_ID'],
            Filter: `email = "${email}"`,
        });
        for await (const userName of userNames.Users.map(
            user => user.Username,
        )) {
            console.log('Disabling Cognito User: ', userName);
            await Clients.cognito.adminDisableUser({
                Username: userName,
                UserPoolId: process.env['COGNITO_USER_POOL_ID'],
            });
        }
        const user = await getUser(email);
        if (process.env['DEXCOM_STREAMING_ENABLED'] === 'true') {
            const dexcomSession = await getSession(email, SessionType.dexcom);
            if (dexcomSession) {
                console.log('Disabling Dexcom Session: ', dexcomSession);
                await setStreamingStateFromDexcom(
                    false,
                    dexcomSession as OAuthSession,
                );
            }
        }
        console.log('Deleting Record From DynamoDB With Email ', email);
        await deleteUserData(email);
        if (user?.userTopicArn) {
            console.log('Deleting User Topic: ', user.userTopicArn);
            await deleteUserTopic(user.userTopicArn);
        }
        for await (const userName of userNames.Users.map(
            user => user.Username,
        )) {
            console.log('Deleting Cognito User: ', userName);
            await Clients.cognito.adminDeleteUser({
                Username: userName,
                UserPoolId: process.env['COGNITO_USER_POOL_ID'],
            });
        }
    } catch (err) {
        console.error(`Error deleting user with email: ${email}`, err);
        throw err;
    }
};
