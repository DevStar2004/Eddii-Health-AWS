import { PostConfirmationTriggerEvent } from 'aws-lambda';
import { User, createUser, createUserTopic, getUser } from '@eddii-backend/dal';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';

export const handler = async (event: PostConfirmationTriggerEvent) => {
    if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
        console.log(`New User Confirmed - ${event.request.userAttributes.sub}`);
        const email = event.request.userAttributes.email.toLowerCase();
        const existingUser = await getUser(email);
        if (existingUser) {
            return event;
        }
        const userTopicArn = await createUserTopic(email);
        const user = new User(
            email,
            event.request.userAttributes.nickname,
            event.request.userAttributes.locale,
            event.request.userAttributes.zoneinfo,
        );
        user.userTopicArn = userTopicArn;
        await createUser(user);
    }
    return event;
};
