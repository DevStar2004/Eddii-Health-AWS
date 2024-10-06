import axios from 'axios';
import { getSecret } from './secrets';
import Clients from '@eddii-backend/clients';

jest.mock('axios');

describe('getSecret', () => {
    const secretName = 'testSecret';
    const secretValue = 'secretValue';

    beforeEach(() => {
        jest.clearAllMocks();
        process.env['AWS_SESSION_TOKEN'] = 'dummy_token';
        process.env['AWS_REGION'] = 'us-east-1';
    });

    it('should throw an error if secretName is not provided', async () => {
        await expect(getSecret('')).rejects.toThrow(
            'Secret name not provided.',
        );
    });

    it('should retrieve a secret using the HTTP endpoint', async () => {
        (axios.get as jest.Mock).mockResolvedValue({
            data: { SecretString: secretValue },
        });

        const result = await getSecret(secretName);
        expect(result).toBe(secretValue);
    });

    it('should fallback to SecretsManagerClient if the HTTP request fails', async () => {
        (axios.get as jest.Mock).mockRejectedValue(new Error('Network Error'));
        const sendMock = (
            Clients.secretsManager.send as jest.Mock
        ).mockResolvedValue({
            SecretString: secretValue,
        });

        const result = await getSecret(secretName);
        expect(sendMock).toHaveBeenCalledWith(expect.anything());
        expect(result).toBe(secretValue);
    });

    it('should throw an error if the secret is not found by SecretsManagerClient', async () => {
        (axios.get as jest.Mock).mockRejectedValue(new Error('Network Error'));
        const sendMock = (
            Clients.secretsManager.send as jest.Mock
        ).mockResolvedValue({});

        await expect(getSecret(secretName)).rejects.toThrow(
            `Secret ${secretName} not found.`,
        );
        expect(sendMock).toHaveBeenCalledWith(expect.anything());
    });
});
