import { getLocation } from './location';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getLocation', () => {
    it('returns location data when the API call is successful', async () => {
        const mockIp = '123.123.123.123';
        const mockResponse = {
            data: {
                status: 'success',
                countryCode: 'US',
                region: 'California',
            },
        };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const location = await getLocation(mockIp);

        expect(location).toEqual({
            countryCode: 'US',
            region: 'California',
        });
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `http://ip-api.com/json/${mockIp}?fields=status,countryCode,region`,
        );
    });

    it('returns undefined when the API call is unsuccessful', async () => {
        const mockIp = '123.123.123.123';
        const mockResponse = {
            data: {
                status: 'fail',
            },
        };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const location = await getLocation(mockIp);

        expect(location).toBeUndefined();
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `http://ip-api.com/json/${mockIp}?fields=status,countryCode,region`,
        );
    });
});
