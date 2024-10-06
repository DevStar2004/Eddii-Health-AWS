import { Request, Response } from 'lambda-api';
import {
    addStreak as addStreakToDal,
    getStreak as getStreakFromDal,
    listStreaks as listStreaksFromDal,
    addHeartsForUser as addHeartsForUserFromDal,
    updateGameScoreForce,
    getUser,
    getHighScoreForGame,
    incrementGameScore,
} from '@eddii-backend/dal';
import { isValidDate } from '@eddii-backend/utils';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const addStreak = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const now = new Date();
    const todayVisitedAt = now.toISOString().split('T')[0];
    const newDay = await getStreakFromDal(email, todayVisitedAt);
    if (newDay) {
        const user = await getUser(email);
        response.status(200).json({
            streak: newDay,
            user: undefined,
        });
        return;
    } else {
        const streak = await addStreakToDal(email);
        const yesterdayVisitedAt = new Date(now.getTime() - DAY_IN_MILLISECONDS)
            .toISOString()
            .split('T')[0];
        const yesterday = await getStreakFromDal(email, yesterdayVisitedAt);
        let currentStreak = 1;
        if (!yesterday) {
            // Streak is broken, reset the streak count.
            await updateGameScoreForce('streak', email, 1);
        } else {
            const leaderboardEntry = await incrementGameScore(
                'streak',
                email,
                1,
            );
            currentStreak = leaderboardEntry.score;
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
        response.status(200).json({ streak: streak, user: fetchedUser });
        return;
    }
};

export const listStreaks = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.query.startDate) {
        response.status(400).json({ message: 'StartDate is required.' });
        return;
    }
    if (!request.query.endDate) {
        response.status(400).json({ message: 'EndDate is required.' });
        return;
    }
    if (!isValidDate(request.query.startDate)) {
        response
            .status(400)
            .json({ message: 'Invalid StartDate time format.' });
        return;
    }
    if (!isValidDate(request.query.endDate)) {
        response.status(400).json({ message: 'Invalid EndDate time format.' });
        return;
    }

    const { startDate, endDate, page } = request.query;

    const [streaks, pageToken] = await listStreaksFromDal(
        email,
        startDate,
        endDate,
        page,
    );
    response.status(200).json({ streaks: streaks, page: pageToken });
};

export const getCurrentStreak = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const streakLeaderboardEntry = await getHighScoreForGame('streak', email);
    if (!streakLeaderboardEntry) {
        response.status(200).json({ currentStreak: 0, lastVisitedAt: null });
        return;
    }
    response.status(200).json({
        currentStreak: streakLeaderboardEntry.score,
        lastVisitedAt: streakLeaderboardEntry.updatedAt.split('T')[0],
    });
};
