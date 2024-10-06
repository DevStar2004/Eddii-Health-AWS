import { Request, Response } from 'lambda-api';
import {
    batchGetUserProfiles,
    listTopScoresForGame,
    getQuiz as getQuizFromDal,
    getQuizStatus as getQuizStatusFromDal,
    addHeartsForUser as addHeartsForUserFromDal,
    getHighScoreForGame as getHighScoreForGameFromDal,
    updateCorrectQuestionForQuiz,
    updateGameScore,
    getUser,
    spendHearts,
    QuestionType,
    Quiz,
    getStoreItem,
    Slot,
} from '@eddii-backend/dal';
import { validGameId, validQuizId } from '@eddii-backend/utils';
import { t, changeLanguage } from '@eddii-backend/translate';

const GAME_ASSETS_DISTRIBUTION_URL = `https://${process.env['ASSETS_DISTRIBUTION_DOMAIN_NAME']}/games`;

const GAME_PRICE = 2;

const GAMES = [
    {
        gameId: 'eddiiNinja',
        gameName: 'eddii Ninja',
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/eddii-ninja/thumbnail.png`,
        gameUrl: `${GAME_ASSETS_DISTRIBUTION_URL}/eddii-ninja/index.html`,
        gameDescription:
            'Slice fruits and learn carb counting! Master carbohydrate estimation while having fun.',
        orientation: 'landscape',
    },
    {
        gameId: 'brawlHero',
        gameName: 'Brawl Hero',
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/brawl-hero/thumbnail.jpg`,
        gameUrl:
            'https://marketjs.eddii.games/en/eddii-health-brawl-hero/1724389993367/index.html',
        gameDescription:
            'Fight monsters in this endless rogue-like game. Throw balls at enemies, move around, and avoid bullets.',
    },
    {
        gameId: 'wheresThePhone',
        gameName: "Where's the Phone?",
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/wheres-the-phone/thumbnail.png`,
        gameUrl:
            'https://marketjs.eddii.games/en/eddii-health-wheres-the-phone/1724390138442/index.html',
        gameDescription:
            'Follow the box hiding a smartphone. Guess correctly as boxes shuffle at unpredictable speeds.',
    },
    {
        gameId: 'kongClimb',
        gameName: 'Kong Climb',
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/kong-climb/thumbnail.jpg`,
        gameUrl:
            'https://marketjs.eddii.games/en/eddii-health-kong-climb/1724390000478/index.html',
        gameDescription:
            'Help Kong climb the tower. Eat bananas for strength, chili for speed. How high can you go?',
    },
    {
        gameId: 'duneBuggyRacing',
        gameName: 'Dune Buggy Racing',
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/dune-buggy-racing/thumbnail.png`,
        gameUrl:
            'https://marketjs.eddii.games/en/eddii-health-dune-buggy-racing/1724389689812/index.html',
        gameDescription:
            'Race dune buggies, switch lanes, and avoid crashes in this fast-paced game.',
        requiresSubscription: true,
    },
    {
        gameId: 'milkBottlingChallenge',
        gameName: 'Milk Bottling Challenge',
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/milk-bottling-challenge/thumbnail.png`,
        gameUrl:
            'https://marketjs.eddii.games/en/eddii-health-milk-bottling-challenge/1724756081053/index.html',
        gameDescription:
            "Fill milk bottles to the required line. Aim for bonus points, but don't spill!",
        requiresSubscription: true,
    },
    {
        gameId: 'skyHigh',
        gameName: 'Sky High',
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/magnificent-tower/thumbnail.png`,
        gameUrl:
            'https://marketjs.eddii.games/en/eddii-health-magnificent-tower/1724390159412/index.html',
        gameDescription:
            'Build the highest tower possible. Time your block placements perfectly.',
        requiresSubscription: true,
        orientation: 'portrait',
    },
    {
        gameId: 'chickenBlast',
        gameName: 'Chicken Blast',
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/chicken-blast/thumbnail.jpg`,
        gameUrl:
            'https://marketjs.eddii.games/en/eddii-health-chicken-blast/1724396224726/index.html',
        gameDescription:
            'Match chickens by color, use powerups, and aim for the high score.',
        requiresSubscription: true,
    },
    {
        gameId: 'hoopStar',
        gameName: 'Hoop Star',
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/hoop-star/thumbnail.jpg`,
        gameUrl:
            'https://marketjs.eddii.games/en/eddii-health-hoop-star-responsive-hd/1724395654381/index.html',
        gameDescription:
            "Catch every basketball by moving the hoop. Don't miss any!",
        requiresSubscription: true,
        orientation: 'portrait',
    },
    {
        gameId: 'superJump',
        gameName: 'Super Jump',
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/super-jump/thumbnail.jpg`,
        gameUrl:
            'https://marketjs.eddii.games/en/eddii-health-super-jump/1724394729451/index.html',
        gameDescription:
            'Jump over rooftops as a caped superhero. Collect powerups and avoid obstacles.',
        requiresSubscription: true,
        orientation: 'portrait',
    },
    {
        gameId: 'skiHero',
        gameName: 'Ski Hero',
        gameThumbnail: `${GAME_ASSETS_DISTRIBUTION_URL}/ski-hero/thumbnail.png`,
        gameUrl:
            'https://marketjs.eddii.games/en/eddii-health-ski-hero/1724747465635/index.html',
        gameDescription:
            'Ski down the mountain while avoiding obstacles. Stay on course!',
        requiresSubscription: true,
        orientation: 'portrait',
    },
];

const translateQuiz = (quiz: Quiz) => {
    const translatedQuiz = { ...quiz };
    translatedQuiz.questions = quiz.questions.map(question => ({
        ...question,
        question:
            question.type === QuestionType.TEXT
                ? t(question.question)
                : question.question,
        possibleAnswers: question.possibleAnswers.map(answer =>
            question.type === QuestionType.TEXT ? t(answer) : answer,
        ),
        correctAnswers: question.correctAnswers.map(answer =>
            question.type === QuestionType.TEXT ? t(answer) : answer,
        ),
    }));
    return translatedQuiz;
};

export const getLeaderboardForGame = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const gameId = request.params.gameId;
    if (!gameId) {
        response.status(400).json({ message: 'Game ID is required.' });
        return;
    }
    if (!validGameId(gameId)) {
        response.status(400).json({ message: 'Invalid Game ID.' });
        return;
    }
    const { page } = request.query;

    const [leaderboardEntries, pageToken] = await listTopScoresForGame(
        gameId,
        page,
    );
    const mergedLeaderboardEntries = [];
    const userProfiles = await batchGetUserProfiles(
        leaderboardEntries.map(entry => entry.email),
    );
    const userProfileLookup = new Map();
    for (const entry of userProfiles) {
        let avatarWithCdnInfo = null;
        if (entry.avatar) {
            avatarWithCdnInfo = getStoreItem(entry.avatar, Slot.avatar);
        }
        let badgesWithCdnInfo = null;
        if (entry.badges?.length > 0) {
            badgesWithCdnInfo = entry.badges.map(badge =>
                getStoreItem(badge, Slot.badge),
            );
        }
        userProfileLookup.set(entry.email, {
            ...entry,
            ...(entry.avatar ? { avatar: avatarWithCdnInfo } : {}),
            ...(entry.badges?.length > 0 ? { badges: badgesWithCdnInfo } : {}),
        });
    }
    for (const entry of leaderboardEntries) {
        mergedLeaderboardEntries.push({
            ...entry,
            ...userProfileLookup.get(entry.email),
        });
    }
    response.status(200).json({
        leaderboardEntries: mergedLeaderboardEntries,
        page: pageToken,
    });
};

export const playGame = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const user = await getUser(email);
    if (!user) {
        response.status(404).json({ message: 'User not found.' });
        return;
    }
    if (user.hearts < GAME_PRICE) {
        response.status(400).json({ message: 'Not enough hearts.' });
        return;
    }
    const userToReturn = await spendHearts(email, GAME_PRICE);
    if (!userToReturn) {
        // Race condition if hearts are depleted between the check and the play
        response.status(400).json({ message: 'Not enough hearts.' });
        return;
    }
    response.status(200).json(userToReturn);
};

export const gameList = async (
    request: Request,
    response: Response,
): Promise<void> => {
    response.status(200).json({ games: GAMES });
};

export const finishGame = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const gameId = request.params.gameId;
    const { score } = request.body;
    if (!gameId) {
        response.status(400).json({ message: 'Game ID is required.' });
        return;
    }
    if (!validGameId(gameId)) {
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
    const entry = await updateGameScore(gameId, email, score);
    response.status(200).json({ leaderboardEntry: entry });
};

export const getHighScoreForGame = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const gameId = request.params.gameId;
    if (!gameId) {
        response.status(400).json({ message: 'Game ID is required.' });
        return;
    }
    if (!validGameId(gameId)) {
        response.status(400).json({ message: 'Invalid Game ID.' });
        return;
    }
    let leaderboardEntry = await getHighScoreForGameFromDal(gameId, email);
    if (!leaderboardEntry) {
        leaderboardEntry = {
            email: email,
            gameId: gameId,
            score: 0,
            updatedAt: new Date().toISOString(),
        };
    }

    response.status(200).json({ leaderboardEntry: leaderboardEntry });
};

export const getQuiz = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const quizId = request.params.quizId;
    if (!quizId) {
        response.status(400).json({ message: 'Quiz ID is required.' });
        return;
    }
    if (!validQuizId(quizId)) {
        response.status(400).json({ message: 'Invalid Quiz ID.' });
        return;
    }
    const user = await getUser(request.userEmail);
    if (user.locale === 'es') {
        await changeLanguage('es');
    }
    const quiz = translateQuiz(getQuizFromDal(quizId));
    response.status(200).json({
        ...quiz,
        questions: quiz.questions
            .map(question => ({
                ...question,
                // Remove correct answer
                correctAnswers: undefined,
            }))
            // Randomize order of questions
            .sort(() => Math.random() - 0.5),
    });
};

export const getQuizStatus = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const quizId = request.params.quizId;
    if (!quizId) {
        response.status(400).json({ message: 'Quiz ID is required.' });
        return;
    }
    if (!validQuizId(quizId)) {
        response.status(400).json({ message: 'Invalid Quiz ID.' });
        return;
    }
    const quizStatus = await getQuizStatusFromDal(email, quizId);
    if (!quizStatus) {
        response.status(200).json({
            email: email,
            quizId: quizId,
            correctQuestionIds: [],
            badge: 0,
        });
        return;
    }
    const quiz = getQuizFromDal(quizId);
    const percent =
        (quizStatus.correctQuestionIds.length / quiz.questions.length) * 100;
    let badge = 0;
    if (percent < 25) {
        badge = 0;
    } else if (percent >= 25 && percent < 50) {
        badge = 1;
    } else if (percent >= 50 && percent < 75) {
        badge = 2;
    } else if (percent >= 75 && percent < 100) {
        badge = 3;
    } else {
        badge = 4;
    }
    response.status(200).json({ ...quizStatus, badge: badge });
};

export const answerQuestion = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const quizId = request.params.quizId;
    const questionId = request.params.questionId;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const answer: string[] = request.body.answer;
    if (!answer || answer.length === 0) {
        response.status(400).json({ message: 'Answer is required.' });
        return;
    }
    if (!quizId) {
        response.status(400).json({ message: 'Quiz ID is required.' });
        return;
    }
    if (!validQuizId(quizId)) {
        response.status(400).json({ message: 'Invalid Quiz ID.' });
        return;
    }
    if (!questionId) {
        response.status(400).json({ message: 'Question ID is required.' });
        return;
    }
    const user = await getUser(request.userEmail);
    if (user.locale === 'es') {
        await changeLanguage('es');
    }
    const quiz = translateQuiz(getQuizFromDal(quizId));
    if (quiz.questions.findIndex(q => q.questionId === questionId) === -1) {
        response.status(400).json({ message: 'Invalid Question ID.' });
        return;
    }
    const correctAnswers = new Set([
        ...quiz.questions.find(q => q.questionId === questionId).correctAnswers,
    ]);
    for (const a of answer) {
        if (!correctAnswers.has(a)) {
            response.status(400).json({ message: 'Incorrect answer.' });
            return;
        }
    }
    const quizStatus = await updateCorrectQuestionForQuiz(
        email,
        quizId,
        questionId,
    );
    const percent =
        (quizStatus.correctQuestionIds.length / quiz.questions.length) * 100;
    let badge = 0;
    if (percent < 25) {
        badge = 0;
    } else if (percent >= 25 && percent < 50) {
        badge = 1;
    } else if (percent >= 50 && percent < 75) {
        badge = 2;
    } else if (percent >= 75 && percent < 100) {
        badge = 3;
    } else {
        badge = 4;
    }
    let heartsToAdd = 1;
    if (badge < 4) {
        const prevPercent =
            ((quizStatus.correctQuestionIds.length - 1) /
                quiz.questions.length) *
            100;
        let prevBadge = 0;
        if (prevPercent < 25) {
            prevBadge = 0;
        } else if (prevPercent >= 25 && prevPercent < 50) {
            prevBadge = 1;
        } else if (prevPercent >= 50 && prevPercent < 75) {
            prevBadge = 2;
        } else if (prevPercent >= 75 && prevPercent < 100) {
            prevBadge = 3;
        } else {
            prevBadge = 4;
        }
        if (badge > prevBadge) {
            heartsToAdd += 5;
        }
    }
    const userToReturn = await addHeartsForUserFromDal(
        email,
        heartsToAdd,
        user.dailyHeartsLimit,
        user.dailyHeartsLimitDate,
    );
    response.status(200).json({
        quizStatus: { ...quizStatus, badge: badge },
        user: userToReturn,
    });
};
