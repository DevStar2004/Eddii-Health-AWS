import createAPI, { Request, Response } from 'lambda-api';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
    CORS_DOMAIN_REGEX,
    validateAndNormalizeEmail,
} from '@eddii-backend/utils';
import {
    getLeaderboardForGame,
    getQuiz,
    getQuizStatus,
    answerQuestion,
    playGame,
    finishGame,
    getHighScoreForGame,
    gameList,
} from './lib/game';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';

const api = createAPI({
    logger: {
        access: true,
        errorLogging: true,
        stack: true,
        timestamp: () => new Date().toISOString(),
    },
});

// CORS
api.use((req, res, next) => {
    // Return CORS headers
    if (CORS_DOMAIN_REGEX.test(req.headers.origin)) {
        res.cors({
            origin: req.headers.origin,
        });
    }
    next();
});

api.use((request: Request, response: Response, next: () => void) => {
    if (request.path === '/deep-ping') {
        next();
        return;
    }
    if (request.headers['app-version']) {
        request.appVersion = request.headers['app-version'];
    }
    if (
        request.requestContext.authorizer &&
        request.requestContext.authorizer.claims &&
        request.requestContext.authorizer.claims.email
    ) {
        const email = request.requestContext.authorizer.claims.email;
        const normalizedEmail = validateAndNormalizeEmail(email);
        if (!normalizedEmail) {
            response.status(401).json({ message: 'Not Authorized.' });
            return;
        }
        request.userEmail = normalizedEmail;
        next(); // continue execution
    } else {
        response.status(401).json({ message: 'Not Authorized.' });
    }
});

// Leaderboard Routes.
api.get('/:gameId/leaderboard', getLeaderboardForGame);

// Game Routes.
api.get('/game', gameList);
api.post('/game/:gameId/play', playGame);
api.post('/game/:gameId/finish', finishGame);
api.get('/game/:gameId/high-score', getHighScoreForGame);

// Quiz Routes.
api.get('/quiz/:quizId', getQuiz);
api.get('/quiz/:quizId/status', getQuizStatus);
api.put('/quiz/:quizId/:questionId', answerQuestion);

// Ping Route.
api.get('/deep-ping', async () => {
    return { message: 'ping' };
});

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context,
) => {
    return await api.run(event, context);
};
