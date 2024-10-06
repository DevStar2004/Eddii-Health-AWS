import { Request, Response } from 'lambda-api';
import {
    createGuardian as createGuardianViaDal,
    listUsersForGuardian as listUsersForGuardianFromDal,
    listGuardiansForUser as listGuardiansForUserFromDal,
    deleteGuardian as deleteGuardianFromDal,
    getUser,
    batchGetUserProfiles,
    GuardianStatus,
    GuardianRole,
} from '@eddii-backend/dal';
import { validateAndNormalizeEmail } from '@eddii-backend/utils';
import {
    sendGuardianSignUpEmail,
    sendUserForGuardianSignUpEmail,
} from '@eddii-backend/email';

export const createGuardian = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const guardianEmail = validateAndNormalizeEmail(request.params.email);
    if (!guardianEmail) {
        response
            .status(400)
            .json({ message: 'Valid Guardian Email is required.' });
        return;
    }
    if (guardianEmail.toLowerCase() === email.toLowerCase()) {
        response
            .status(400)
            .json({ message: 'Guardian Email cannot be your own email.' });
        return;
    }
    const guardianUser = await getUser(guardianEmail);
    const guardians = await listUsersForGuardianFromDal(guardianEmail);
    if (
        guardianUser &&
        guardianUser.diabetesInfo !== undefined &&
        guardians &&
        guardians.length === 0
    ) {
        response.status(400).json({
            message: 'An account is already associated with this email.',
        });
        return;
    }
    if (guardians && guardians.length >= 5) {
        response.status(400).json({
            message: 'A guardian can only be associated with 5 accounts.',
        });
        return;
    }
    const yourGuardians = await listGuardiansForUserFromDal(email);
    if (yourGuardians && yourGuardians.length >= 5) {
        response.status(400).json({
            message: 'An account can only have 5 guardians.',
        });
        return;
    }

    if (guardians && guardians.find(g => g.userEmail === email)) {
        response.status(400).json({
            message: 'This guardian is already associated with this user.',
        });
        return;
    }

    const guardian = await createGuardianViaDal(
        guardianEmail,
        email,
        GuardianStatus.active,
        GuardianRole.guardian,
    );
    if (!guardianUser) {
        await sendGuardianSignUpEmail(guardianEmail);
    }
    response.status(200).json(guardian);
};

export const createUserForGuardian = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const guardianEmail = request.userEmail;
    const userEmail = validateAndNormalizeEmail(request.params.email);
    if (!userEmail) {
        response.status(400).json({ message: 'Valid User Email is required.' });
        return;
    }
    if (guardianEmail.toLowerCase() === userEmail.toLowerCase()) {
        response
            .status(400)
            .json({ message: 'User Email cannot be your own email.' });
        return;
    }
    const user = await getUser(userEmail);
    if (user) {
        response.status(400).json({
            message: 'An account is already associated with this email.',
        });
        return;
    }

    const guardians = await listUsersForGuardianFromDal(guardianEmail);
    if (guardians && guardians.length >= 5) {
        response.status(400).json({
            message: 'A guardian can only be associated with 5 accounts.',
        });
        return;
    }

    if (guardians && guardians.find(g => g.userEmail === userEmail)) {
        response.status(400).json({
            message: 'This guardian is already associated with this user.',
        });
        return;
    }

    const guardian = await createGuardianViaDal(
        guardianEmail,
        userEmail,
        GuardianStatus.active,
        GuardianRole.guardian,
    );
    await sendUserForGuardianSignUpEmail(userEmail);
    response.status(200).json(guardian);
};

export const listUsersForGuardian = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const guardians = await listUsersForGuardianFromDal(email);
    if (!guardians || guardians.length === 0) {
        response.status(200).json(guardians);
    } else {
        const emails = new Set<string>();
        for (const guardian of guardians) {
            emails.add(guardian.userEmail);
            emails.add(guardian.guardianEmail);
        }
        const userProfiles = await batchGetUserProfiles(Array.from(emails));
        const guardiansWithProfiles = guardians.map(guardian => {
            const userProfile = userProfiles.find(
                profile => profile.email === guardian.userEmail,
            );
            const guardianProfile = userProfiles.find(
                profile => profile.email === guardian.guardianEmail,
            );
            return {
                ...guardian,
                userProfile,
                guardianProfile,
            };
        });
        response.status(200).json(guardiansWithProfiles);
    }
};

export const listGuardiansForUser = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const guardians = await listGuardiansForUserFromDal(email);
    if (!guardians || guardians.length === 0) {
        response.status(200).json(guardians);
    } else {
        const emails = new Set<string>();
        for (const guardian of guardians) {
            emails.add(guardian.userEmail);
            emails.add(guardian.guardianEmail);
        }
        const userProfiles = await batchGetUserProfiles(Array.from(emails));
        const guardiansWithProfiles = guardians.map(guardian => {
            const userProfile = userProfiles.find(
                profile => profile.email === guardian.userEmail,
            );
            const guardianProfile = userProfiles.find(
                profile => profile.email === guardian.guardianEmail,
            );
            return {
                ...guardian,
                userProfile,
                guardianProfile,
            };
        });
        response.status(200).json(guardiansWithProfiles);
    }
};

export const deleteGuardian = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const guardianEmail = validateAndNormalizeEmail(request.params.email);
    if (!guardianEmail) {
        response
            .status(400)
            .json({ message: 'Valid Guardian Email is required.' });
        return;
    }
    if (guardianEmail === email) {
        response
            .status(400)
            .json({ message: 'Guardian Email cannot be your own email.' });
        return;
    }
    await deleteGuardianFromDal(guardianEmail, email);
    response.status(200).json({ message: 'Guardian deleted.' });
};

export const deleteUserForGuardian = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const guardianEmail = request.userEmail;
    const userEmail = validateAndNormalizeEmail(request.params.email);
    if (!userEmail) {
        response.status(400).json({ message: 'Valid User Email is required.' });
        return;
    }
    if (guardianEmail === userEmail) {
        response
            .status(400)
            .json({ message: 'User Email cannot be your own email.' });
        return;
    }
    await deleteGuardianFromDal(guardianEmail, userEmail);
    response.status(200).json({ message: 'Guardian deleted.' });
};
