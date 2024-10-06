import { Request, Response } from 'lambda-api';
import {
    addStreak as addStreakToDal,
    getStreak as getStreakFromDal,
    addHeartsForUser as addHeartsForUserFromDal,
    updateGameScoreForce,
    getUser,
    incrementGameScore,
} from '@eddii-backend/dal';
import { getSecret } from '@eddii-backend/secrets';
import { auth } from 'google-auth-library';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const addStreak = async (email: string): Promise<void> => {
    try {
        const now = new Date();
        const todayVisitedAt = now.toISOString().split('T')[0];
        const newDay = await getStreakFromDal(email, todayVisitedAt);
        if (newDay) {
            console.log('Streak already exists.');
            return;
        }
        await addStreakToDal(email);
        const yesterdayVisitedAt = new Date(now.getTime() - DAY_IN_MILLISECONDS)
            .toISOString()
            .split('T')[0];
        const yesterday = await getStreakFromDal(email, yesterdayVisitedAt);
        let currentStreak = 1;
        if (!yesterday) {
            console.log('Streak is broken, reset the streak count.');
            await updateGameScoreForce('streak', email, 1);
        } else {
            const leaderboardEntry = await incrementGameScore(
                'streak',
                email,
                1,
            );
            currentStreak = leaderboardEntry.score;
            console.log(`Current streak: ${currentStreak}`);
        }
        const user = await getUser(email);
        let fetchedUser;
        if (
            currentStreak === 2 ||
            currentStreak === 5 ||
            currentStreak === 15 ||
            currentStreak === 30
        ) {
            let hearts = 5;
            if (currentStreak === 5) {
                hearts = 15;
            } else if (currentStreak === 15) {
                hearts = 30;
            } else if (currentStreak === 30) {
                hearts = 50;
            }
            fetchedUser = await addHeartsForUserFromDal(
                email,
                hearts,
                user.dailyHeartsLimit,
                user.dailyHeartsLimitDate,
                true,
            );
        }
        return;
    } catch (error) {
        console.log('Error while executing addStreak for mixpanel webhook');
    }
};

export interface WebhookMessage {
    action: 'members' | 'add_members' | 'remove_members';
    status: 'success' | 'failure';
    error?: AudienceError;
    parameters?: AudienceParameters;
}

export interface AudienceError {
    message: string;
    code: number;
}

export interface AudienceParameters {
    mixpanel_project_id: string;
    mixpanel_cohort_name: string;
    mixpanel_cohort_id: string;
    mixpanel_cohort_description: string;
    mixpanel_session_id: string;
    members: AudienceMember[];
    page_info: Pagination;
}

export interface AudienceMember {
    email: string;
    first_name: string;
    last_name: string;
    mixpanel_distinct_id: string;
    partner_user_id: string;
    phone_number: string;
}

export interface Pagination {
    page_count: number;
    total_pages: number;
}

export const cohortWebhook = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const body = request.body as WebhookMessage;
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        response.status(401).json({
            action: body.action,
            status: 'failure',
            error: {
                message: 'Authorization header missing',
                code: 401,
            },
        });
        return;
    }

    const encodedCreds = authHeader.split(' ')[1];
    const decodedCreds = Buffer.from(encodedCreds, 'base64').toString();
    const [username, password] = decodedCreds.split(':');

    const mixpanelWebhookSecretRaw = await getSecret(
        process.env['MIXPANEL_WEBHOOK_SECRET'],
    );
    const mixpanelWebhookSecret = JSON.parse(mixpanelWebhookSecretRaw);
    if (
        mixpanelWebhookSecret.username !== username ||
        mixpanelWebhookSecret.password !== password
    ) {
        response.status(401).json({
            action: body.action,
            status: 'failure',
            error: {
                message: 'Unauthorized',
                code: 401,
            },
        });
        return;
    }

    if (body.parameters.mixpanel_cohort_name === 'Daily Users') {
        if (body.action === 'add_members' || body.action === 'members') {
            for (const member of body.parameters.members) {
                if (member.email) {
                    console.log(`Adding streak for ${member.email}`);
                    await addStreak(member.email);
                }
            }
        } else {
            console.log('remove_members not supported for now.');
        }
    } else {
        console.log('Cohort not supported');
    }

    response.status(200).json({
        action: body.action,
        status: 'success',
    });
};
