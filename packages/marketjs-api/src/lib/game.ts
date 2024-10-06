import {
    getUser,
    updateGameScore,
    getHighScoreForGame,
} from '@eddii-backend/dal';
import {
    validGameId,
    validNumber,
    validateAndNormalizeEmail,
} from '@eddii-backend/utils';
import { Request, Response } from 'lambda-api';

export const submitScore = async (
    request: Request,
    response: Response,
): Promise<void> => {
    try {
        if (!request.body) {
            response.status(400).json({ message: 'Missing Body.' });
            return;
        }

        const { score, game_id, user_id, time, is_valid, tournament_id } =
            request.body;

        console.log(JSON.stringify(request.body));

        if (!game_id) {
            response.status(400).json({ message: 'Game ID is required.' });
            return;
        }
        if (!validGameId(game_id)) {
            response.status(400).json({ message: 'Invalid Game ID.' });
            return;
        }
        if (game_id === 'streak') {
            response.status(400).json({ message: 'Invalid Game ID.' });
            return;
        }

        if (score === undefined) {
            response.status(400).json({ message: 'Score is required.' });
            return;
        }
        if (typeof score !== 'number') {
            response.status(400).json({ message: 'Score must be a number.' });
            return;
        }

        if (!is_valid) {
            console.warn(
                `Fraudulent Score for game_id: ${game_id} by user_id: ${user_id} with score: ${score}`,
            );
            response.status(200).json({
                message: 'Fraudulent Score: Skipping',
            });
            return;
        }

        if (!user_id) {
            response.status(400).json({ message: 'User ID is required.' });
            return;
        }
        const email = validateAndNormalizeEmail(user_id);
        if (!email) {
            response.status(400).json({ message: 'Invalid User ID.' });
            return;
        }
        const user = await getUser(email);
        if (!user) {
            response.status(404).json({ message: 'User not found.' });
            return;
        }

        await updateGameScore(game_id, email, score);
        response.status(200).json({
            message: 'Score submitted successfully',
        });
        return;
    } catch (error) {
        console.error('Error while updating user score', error);
        response.status(500).json({
            error: error?.message || error || 'Error while updating user score',
        });
        return;
    }
};

export const getScore = async (
    request: Request,
    response: Response,
): Promise<void> => {
    try {
        if (!request.query) {
            response.status(400).json({ message: 'Missing Query Params.' });
            return;
        }

        const { game_id, user_id } = request.query;

        if (!game_id) {
            response.status(400).json({ message: 'Game ID is required.' });
            return;
        }
        if (!validGameId(game_id)) {
            response.status(400).json({ message: 'Invalid Game ID.' });
            return;
        }

        if (!user_id) {
            response.status(400).json({ message: 'User ID is required.' });
            return;
        }
        const email = validateAndNormalizeEmail(user_id);
        if (!email) {
            response.status(400).json({ message: 'Invalid User ID.' });
            return;
        }

        const user = await getUser(email);
        if (!user) {
            response.status(404).json({ message: 'User not found.' });
            return;
        }

        const score = await getHighScoreForGame(game_id, email);
        response.status(200).json({
            game_id,
            user_id: email,
            score,
        });
    } catch (error) {
        console.error('Error while fetching user score', error);
        response.status(500).json({
            error: error?.message || error || 'Error while fetching user score',
        });
    }
};
