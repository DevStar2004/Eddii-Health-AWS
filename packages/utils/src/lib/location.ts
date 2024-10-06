import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, { retries: 5, retryDelay: axiosRetry.exponentialDelay });

export interface Location {
    countryCode: string;
    region: string;
}

export const getLocation = async (
    ip: string,
): Promise<Location | undefined> => {
    const response = await axios.get(
        `http://ip-api.com/json/${ip}?fields=status,countryCode,region`,
    );
    if (response.data.status === 'success') {
        return {
            countryCode: response.data.countryCode,
            region: response.data.region,
        };
    }
    return undefined;
};
