import {
    GuardianRole,
    GuardianStatus,
    batchGetUserProfiles,
    createGuardian,
    deleteGuardian,
    getGuardianForUser,
    getUser,
    isGuardianForUser,
    listGuardiansForUser,
    listUsersForGuardian,
    updateGuardianNotificationSettings as updateGuardianNotificationSettingsFromDal,
    updateGuardianStatus,
} from '@eddii-backend/dal';
import {
    sendGuardianSignUpEmail,
    sendUserForGuardianSignUpEmail,
} from '@eddii-backend/email';
import { publishPushNotificationToUserTopicArn } from '@eddii-backend/notifications';
import { validateAndNormalizeEmail } from '@eddii-backend/utils';
import { Request, Response } from 'lambda-api';

const MAX_FOLLOWERS = 1000;

const canFollow = async (
    followerEmail: string,
    followingEmail: string,
): Promise<boolean> => {
    const followers = await listUsersForGuardian(followerEmail);
    if (followers && followers.length >= MAX_FOLLOWERS) {
        return false;
    }
    const yourFollowers = await listGuardiansForUser(followingEmail);
    if (yourFollowers && yourFollowers.length >= MAX_FOLLOWERS) {
        return false;
    }
    if (followers && followers.find(g => g.userEmail === followingEmail)) {
        return false;
    }
    return true;
};

export const createFollower = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const followerEmail = validateAndNormalizeEmail(
        request.params.followerEmail,
    );
    let { role } = request.body;
    if (!role) {
        role = GuardianRole.follower;
    }
    if (role !== GuardianRole.guardian && role !== GuardianRole.follower) {
        response.status(400).json({ message: 'Invalid Role value.' });
        return;
    }
    if (!followerEmail) {
        response
            .status(400)
            .json({ message: 'Valid Follower Email is required.' });
        return;
    }
    if (followerEmail.toLowerCase() === email.toLowerCase()) {
        response
            .status(400)
            .json({ message: 'Follower Email cannot be your own email.' });
        return;
    }
    const existingGuardian = await getGuardianForUser(followerEmail, email);
    if (existingGuardian) {
        response.status(400).json({ message: 'Already a follower.' });
        return;
    }
    if (!(await canFollow(followerEmail, email))) {
        response.status(400).json({
            message: `Invalid Follower.`,
        });
        return;
    }

    const guardian = await createGuardian(
        followerEmail,
        email,
        GuardianStatus.active,
        role,
    );
    try {
        const followerUser = await getUser(followerEmail);
        if (!followerUser) {
            await sendGuardianSignUpEmail(followerEmail);
        } else {
            const user = await getUser(email);
            await publishPushNotificationToUserTopicArn(
                followerUser.userTopicArn,
                `You've been added as a ${role}!`,
                `${user.nickname} has added you as a ${role}.`,
                `guardian/${email}`,
            );
        }
    } catch (e) {
        // Suppress
        console.error(e);
    }
    response.status(200).json(guardian);
};

export const acceptFollower = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const followerEmail = validateAndNormalizeEmail(
        request.params.followerEmail,
    );
    if (!followerEmail) {
        response
            .status(400)
            .json({ message: 'Valid Follower Email is required.' });
        return;
    }
    const existingGuardian = await getGuardianForUser(followerEmail, email);
    if (!existingGuardian) {
        response.status(404).json({ message: 'Follower pair does not exist.' });
        return;
    }
    if (existingGuardian.status === GuardianStatus.active) {
        response.status(400).json({ message: 'Follower is already accepted.' });
        return;
    }
    const guardian = await updateGuardianStatus(
        followerEmail,
        email,
        GuardianStatus.active,
    );
    response.status(200).json(guardian);
};

export const listFollowers = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const followers = await listGuardiansForUser(email);
    if (!followers || followers.length === 0) {
        response.status(200).json(followers);
    } else {
        const emails = new Set<string>();
        for (const guardian of followers) {
            emails.add(guardian.userEmail);
            emails.add(guardian.guardianEmail);
        }
        const userProfiles = await batchGetUserProfiles(Array.from(emails));
        const followersWithProfiles = followers.map(guardian => {
            const userProfile = userProfiles.find(
                profile => profile.email === guardian.userEmail,
            );
            const guardianProfile = userProfiles.find(
                profile => profile.email === guardian.guardianEmail,
            );
            return {
                ...guardian,
                status: guardian.status || GuardianStatus.active,
                role: guardian.role || GuardianRole.guardian,
                userProfile,
                guardianProfile,
            };
        });
        response.status(200).json(followersWithProfiles);
    }
};

export const deleteFollower = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const followerEmail = validateAndNormalizeEmail(
        request.params.followerEmail,
    );
    if (!followerEmail) {
        response
            .status(400)
            .json({ message: 'Valid Follower Email is required.' });
        return;
    }
    if (followerEmail === email) {
        response
            .status(400)
            .json({ message: 'Follower Email cannot be your own email.' });
        return;
    }
    await deleteGuardian(followerEmail, email);
    response.status(200).json({ message: 'Follower deleted.' });
};

export const requestToFollow = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const followingEmail = validateAndNormalizeEmail(
        request.params.followingEmail,
    );
    let { role } = request.body;
    if (!role) {
        role = GuardianRole.follower;
    }
    if (role !== GuardianRole.guardian && role !== GuardianRole.follower) {
        response.status(400).json({ message: 'Invalid Role value.' });
        return;
    }
    if (!followingEmail) {
        response
            .status(400)
            .json({ message: 'Valid Following Email is required.' });
        return;
    }
    if (followingEmail === email) {
        response
            .status(400)
            .json({ message: 'Following Email cannot be your own email.' });
        return;
    }
    const existingGuardian = await getGuardianForUser(email, followingEmail);
    if (existingGuardian) {
        response.status(400).json({ message: 'Already following.' });
        return;
    }
    if (!(await canFollow(email, followingEmail))) {
        response.status(400).json({
            message: `Invalid Follower.`,
        });
        return;
    }

    const followingUser = await getUser(followingEmail);
    const guardian = await createGuardian(
        email,
        followingEmail,
        !followingUser ? GuardianStatus.active : GuardianStatus.pending,
        role,
    );

    try {
        if (!followingUser) {
            await sendUserForGuardianSignUpEmail(followingEmail);
        } else {
            const user = await getUser(email);
            await publishPushNotificationToUserTopicArn(
                followingUser.userTopicArn,
                `Request to follow`,
                `${user.nickname} has requested to follow you.`,
                `guardian/${email}`,
            );
        }
    } catch (e) {
        // Suppress
        console.error(e);
    }
    response.status(200).json(guardian);
};

export const listFollowing = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const following = await listUsersForGuardian(email);
    if (!following || following.length === 0) {
        response.status(200).json(following);
    } else {
        const emails = new Set<string>();
        for (const guardian of following) {
            emails.add(guardian.userEmail);
            emails.add(guardian.guardianEmail);
        }
        const userProfiles = await batchGetUserProfiles(Array.from(emails));
        const followingWithProfiles = following.map(guardian => {
            const userProfile = userProfiles.find(
                profile => profile.email === guardian.userEmail,
            );
            const guardianProfile = userProfiles.find(
                profile => profile.email === guardian.guardianEmail,
            );
            return {
                ...guardian,
                status: guardian.status || GuardianStatus.active,
                role: guardian.role || GuardianRole.guardian,
                userProfile,
                guardianProfile,
            };
        });
        response.status(200).json(followingWithProfiles);
    }
};

export const deleteFollowing = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const followingEmail = validateAndNormalizeEmail(
        request.params.followingEmail,
    );
    if (!followingEmail) {
        response
            .status(400)
            .json({ message: 'Valid Following Email is required.' });
        return;
    }
    if (followingEmail === email) {
        response
            .status(400)
            .json({ message: 'Following Email cannot be your own email.' });
        return;
    }
    await deleteGuardian(email, followingEmail);
    response.status(200).json({ message: 'Following deleted.' });
};

export const updateGuardianNotificationSettings = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const guardianEmail = request.guardianEmail;
    const userEmail = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { lowGlucoseAlertThreshold, highGlucoseAlertThreshold } =
        request.body;
    if (
        lowGlucoseAlertThreshold !== undefined &&
        (typeof lowGlucoseAlertThreshold !== 'number' ||
            lowGlucoseAlertThreshold < 0)
    ) {
        response
            .status(400)
            .json({ message: 'Invalid lowGlucoseAlertThreshold value.' });
        return;
    }
    if (
        lowGlucoseAlertThreshold !== undefined &&
        lowGlucoseAlertThreshold > 80
    ) {
        response
            .status(400)
            .json({ message: 'Low Glucose Alert must be <=80.' });
        return;
    }

    if (
        highGlucoseAlertThreshold !== undefined &&
        (typeof highGlucoseAlertThreshold !== 'number' ||
            highGlucoseAlertThreshold < 0)
    ) {
        response
            .status(400)
            .json({ message: 'Invalid highGlucoseAlertThreshold value.' });
        return;
    }
    if (
        highGlucoseAlertThreshold !== undefined &&
        highGlucoseAlertThreshold < 120
    ) {
        response
            .status(400)
            .json({ message: 'High Glucose Alert must be >=120.' });
        return;
    }

    const isGuardian = await isGuardianForUser(guardianEmail, userEmail);
    if (!isGuardian) {
        response.status(404).json({ message: 'Guardian pair does not exist.' });
        return;
    }

    const guardian = await updateGuardianNotificationSettingsFromDal(
        guardianEmail,
        userEmail,
        lowGlucoseAlertThreshold,
        highGlucoseAlertThreshold,
    );
    response.status(200).json(guardian);
    return;
};
