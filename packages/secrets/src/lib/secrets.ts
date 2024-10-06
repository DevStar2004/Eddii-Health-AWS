import axios from 'axios';
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import Clients from '@eddii-backend/clients';

const AWS_SECRETS_EXTENTION_HTTP_PORT = 2773;
const AWS_SECRETS_EXTENTION_SERVER_ENDPOINT = `http://localhost:${AWS_SECRETS_EXTENTION_HTTP_PORT}/secretsmanager/get?secretId=`;

export const getSecret = async (secretName: string): Promise<string> => {
    if (!secretName) {
        throw new Error(`Secret name not provided.`);
    }
    try {
        const response = await axios.get(
            `${AWS_SECRETS_EXTENTION_SERVER_ENDPOINT}${secretName}`,
            {
                headers: {
                    'X-Aws-Parameters-Secrets-Token':
                        process.env['AWS_SESSION_TOKEN'],
                },
            },
        );
        const secretContent = response.data as { SecretString: string };
        return secretContent.SecretString;
    } catch (err) {
        console.error(err);
        const client = Clients.secretsManager;

        const secret = (
            await client.send(
                new GetSecretValueCommand({
                    SecretId: secretName,
                }),
            )
        ).SecretString;
        if (!secret) {
            throw new Error(`Secret ${secretName} not found.`);
        }
        return secret;
    }
};
