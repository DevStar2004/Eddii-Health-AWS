import { deleteUser } from './lib/user-deletion';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';

exports.handler = async event => {
    for await (const record of event.Records) {
        const { email, job } = JSON.parse(record.body);
        if (job === 'deleteUser') {
            console.log('Deleting user with email: ', email);
            await deleteUser(email);
            console.log('Deleted user with email: ', email);
        } else {
            throw new Error('Unsupported job type.');
        }
    }
};
