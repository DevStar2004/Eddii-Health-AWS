import { Request, Response } from 'lambda-api';
import { listGuardiansForUser, listUsersForGuardian } from '@eddii-backend/dal';
import { getLocation, validateAndNormalizeEmail } from '@eddii-backend/utils';
import { SUPPORTED_PROVIDER_IDS, getProvider } from '@eddii-backend/healthie';

const COUNTRY_ALLOW_LIST = new Set(['US']);

const APP_VERSION_DATA = {
    ios: {
        dev: {
            minBuildVersion: 1,
            startUpdateOn: '2023-08-25T00:00:00Z',
            forceUpdateOn: '2023-09-01T00:00:00Z',
        },
        sandbox: {
            minBuildVersion: 1,
            startUpdateOn: '2023-08-25T00:00:00Z',
            forceUpdateOn: '2023-09-01T00:00:00Z',
        },
        staging: {
            minBuildVersion: 1,
            startUpdateOn: '2023-08-25T00:00:00Z',
            forceUpdateOn: '2023-09-01T00:00:00Z',
        },
        prod: {
            minBuildVersion: 2,
            startUpdateOn: '2023-08-25T00:00:00Z',
            forceUpdateOn: '2023-09-01T00:00:00Z',
        },
    },
    android: {
        dev: {
            minBuildVersion: 1,
            startUpdateOn: '2023-08-25T00:00:00Z',
            forceUpdateOn: '2023-09-01T00:00:00Z',
        },
        sandbox: {
            minBuildVersion: 1,
            startUpdateOn: '2023-08-25T00:00:00Z',
            forceUpdateOn: '2023-09-01T00:00:00Z',
        },
        staging: {
            minBuildVersion: 1,
            startUpdateOn: '2023-08-25T00:00:00Z',
            forceUpdateOn: '2023-09-01T00:00:00Z',
        },
        prod: {
            minBuildVersion: 3,
            startUpdateOn: '2023-08-25T00:00:00Z',
            forceUpdateOn: '2023-09-01T00:00:00Z',
        },
    },
};

export const canSignUp = async (
    request: Request,
    response: Response,
): Promise<void> => {
    let canSignUp = true;
    if (process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging') {
        const sourceIp = request.requestContext.identity.sourceIp;
        if (sourceIp) {
            try {
                const location = await getLocation(sourceIp);
                if (location && !COUNTRY_ALLOW_LIST.has(location.countryCode)) {
                    canSignUp = false;
                }
                // Fail open
            } catch (error) {
                console.error(error);
            }
        } else {
            console.warn('No source IP found in request context');
            // Fail open
        }
    }
    response.status(200).json({ canSignUp: canSignUp });
};

export const canSignUpAsGuardian = async (
    request: Request,
    response: Response,
): Promise<void> => {
    let canSignUp = false;
    const guardianEmail = validateAndNormalizeEmail(request.params.email);
    if (!guardianEmail) {
        response
            .status(400)
            .json({ message: 'Valid Guardian Email is required.' });
        return;
    }
    const users = await listUsersForGuardian(guardianEmail);
    if (users && users.length >= 1) {
        canSignUp = true;
    }
    response.status(200).json({ canSignUp: canSignUp });
};

export const canSignUpAsUser = async (
    request: Request,
    response: Response,
): Promise<void> => {
    let canSignUp = false;
    const userEmail = validateAndNormalizeEmail(request.params.email);
    if (!userEmail) {
        response.status(400).json({ message: 'Valid User Email is required.' });
        return;
    }
    const users = await listGuardiansForUser(userEmail);
    if (users && users.length >= 1) {
        canSignUp = true;
    }
    response.status(200).json({ canSignUp: canSignUp });
};

export const getAppVersion = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const device = request.params.device;
    if (!device || (device !== 'ios' && device !== 'android')) {
        response.status(400).json({ message: 'Valid device is required.' });
        return;
    }

    response.status(200).json({
        buildVersion:
            APP_VERSION_DATA[device][process.env['ENV']].minBuildVersion,
        startUpdateOn:
            APP_VERSION_DATA[device][process.env['ENV']].startUpdateOn,
        forceUpdateOn:
            APP_VERSION_DATA[device][process.env['ENV']].forceUpdateOn,
        showUpdatePrompt: true,
        showReviewPrompt: true,
    });
};

export const canSignUpVirtualCare = async (
    request: Request,
    response: Response,
): Promise<void> => {
    let canSignUp = true;
    if (process.env['ENV'] === 'prod' || process.env['ENV'] === 'staging') {
        const sourceIp = request.requestContext.identity.sourceIp;
        if (sourceIp) {
            try {
                const location = await getLocation(sourceIp);
                const availableStates = new Set();
                for (const providerId of SUPPORTED_PROVIDER_IDS) {
                    const provider = await getProvider(providerId);
                    provider?.state_licenses?.forEach(stateLicense =>
                        availableStates.add(stateLicense.state),
                    );
                }
                if (
                    location &&
                    (!COUNTRY_ALLOW_LIST.has(location.countryCode) ||
                        !availableStates.has(location.region))
                ) {
                    canSignUp = false;
                }
                // Fail open
            } catch (error) {
                console.error(error);
            }
        } else {
            console.warn('No source IP found in request context');
            // Fail open
        }
    }
    response.status(200).json({ canSignUp: canSignUp });
};
