import { Request, Response } from 'lambda-api';
import {
    registerDevice as registerDeviceInDal,
    listDevices as listDevicesInDal,
    unregisterDevice as unregisterDeviceInDal,
    doesDeviceExist,
    extendDeviceExpiration,
} from '@eddii-backend/dal';
import {
    validArbitraryString,
    validDevicePlatform,
} from '@eddii-backend/utils';

export const registerDevice = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const deviceToken = request.body.deviceToken;
    const deviceType = request.body.deviceType;
    if (
        !deviceToken ||
        !validArbitraryString(deviceToken) ||
        deviceToken === 'BLACKLISTED'
    ) {
        response
            .status(400)
            .json({ message: 'Valid Device Token is required.' });
        return;
    }
    if (!deviceType || !validDevicePlatform(deviceType)) {
        response
            .status(400)
            .json({ message: 'Valid Device Type is required.' });
        return;
    }
    if (await doesDeviceExist(email, deviceToken)) {
        const device = await extendDeviceExpiration(email, deviceToken);
        response.status(200).json(device);
        return;
    } else {
        const device = await registerDeviceInDal(
            email,
            deviceToken,
            deviceType,
        );
        response.status(200).json(device);
    }
};

export const listDevices = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const devices = await listDevicesInDal(email);
    response.status(200).json(devices);
};

export const unregisterDevice = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const deviceToken = request.body.deviceToken;
    if (!deviceToken && !validArbitraryString(deviceToken)) {
        response.status(400).json({ message: 'Device Token is required.' });
        return;
    }
    await unregisterDeviceInDal(email, deviceToken);
    response.status(200).json({ message: 'Device unregistered.' });
};
