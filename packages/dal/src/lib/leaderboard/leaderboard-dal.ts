import { getDynamoClient } from '../../aws';
import { LeaderboardEntry } from './leaderboard-model';

const PAGE_LIMIT = 200;

export const updateGameScoreForce = async (
    gameId: string,
    email: string,
    score: number,
): Promise<LeaderboardEntry | undefined> => {
    if (!gameId || !email || score === undefined) {
        throw new Error('Email and GameID and Score are required.');
    }
    console.log(
        `Force updating game-score ${gameId}-${score} for email: ${email}`,
    );
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['LEADERBOARD_TABLE_NAME'] as string,
        Key: {
            gameId: gameId,
            email: email,
        },
        UpdateExpression: 'SET score = :score, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
            ':score': score,
            ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as LeaderboardEntry;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(
            `Failed to force update game-score ${gameId}-${score} for email: ${email}`,
            error,
        );
        throw new Error('Error force updating game-score.');
    }
};

export const updateGameScore = async (
    gameId: string,
    email: string,
    score: number,
    greaterThan = true,
): Promise<LeaderboardEntry | undefined> => {
    if (!gameId || !email || score === undefined) {
        throw new Error('Email and GameID and Score are required.');
    }
    console.log(`Updating game-score ${gameId}-${score} for email: ${email}`);
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['LEADERBOARD_TABLE_NAME'] as string,
        Key: {
            gameId: gameId,
            email: email,
        },
        UpdateExpression: 'SET score = :score, updatedAt = :updatedAt',
        ConditionExpression: `attribute_not_exists(score) OR :score ${
            greaterThan ? '>' : '<'
        } score`,
        ExpressionAttributeValues: {
            ':score': score,
            ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as LeaderboardEntry;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.code === 'ConditionalCheckFailedException') {
            return undefined;
        } else {
            console.error(
                `Failed to update game-score ${gameId}-${score} for email: ${email}`,
                error,
            );
            throw new Error('Error updating game-score.');
        }
    }
};

// increment game score.gameId, email, incrementBy
export const incrementGameScore = async (
    gameId: string,
    email: string,
    incrementBy: number,
): Promise<LeaderboardEntry | undefined> => {
    if (!gameId || !email || incrementBy === undefined) {
        throw new Error('Email and GameID and incrementBy are required.');
    }
    console.log(
        `Incrementing game-score ${gameId}-${incrementBy} for email: ${email}`,
    );
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['LEADERBOARD_TABLE_NAME'] as string,
        Key: {
            gameId: gameId,
            email: email,
        },
        UpdateExpression:
            'SET score = if_not_exists(score, :start) + :incrementBy, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
            ':incrementBy': incrementBy,
            ':start': 0,
            ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        return response.Attributes as LeaderboardEntry;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(
            `Failed to increment game-score ${gameId}-${incrementBy} for email: ${email}`,
            error,
        );
        throw new Error('Error incrementing game-score.');
    }
};

export const listTopScoresForGame = async (
    gameId: string,
    page?: string,
): Promise<[LeaderboardEntry[], string?]> => {
    if (!gameId) {
        throw new Error('Game ID is required.');
    }
    const ddbDocClient = getDynamoClient();

    const lastEvaluatedKey = page
        ? JSON.parse(Buffer.from(page, 'base64').toString('utf8'))
        : undefined;
    const params = {
        TableName: process.env['LEADERBOARD_TABLE_NAME'] as string,
        IndexName: 'gameIdToScoreIndex',
        KeyConditionExpression: '#gameId = :gameId',
        ExpressionAttributeNames: {
            '#gameId': 'gameId',
        },
        ExpressionAttributeValues: {
            ':gameId': gameId,
        },
        ScanIndexForward: false,
        Limit: PAGE_LIMIT,
        ExclusiveStartKey: lastEvaluatedKey,
    };

    try {
        const result = await ddbDocClient.query(params).promise();
        return [
            result.Items ? (result.Items as LeaderboardEntry[]) : [],
            result.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString(
                      'base64',
                  )
                : undefined,
        ];
    } catch (e) {
        console.error(`Failed to list top scores for game: ${e}`);
        throw new Error('Failed to list top scores for game.');
    }
};

export const getHighScoreForGame = async (
    gameId: string,
    email: string,
): Promise<LeaderboardEntry | undefined> => {
    if (!email) {
        throw new Error('Email is required.');
    }
    if (!gameId) {
        throw new Error('Game ID is required.');
    }
    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['LEADERBOARD_TABLE_NAME'] as string,
        Key: {
            gameId: gameId,
            email: email,
        },
    };

    try {
        const result = await ddbDocClient.get(params).promise();
        if (!result.Item) {
            return undefined;
        }
        return result.Item as LeaderboardEntry;
    } catch (e) {
        console.error(`Failed to list top scores for game: ${e}`);
        throw new Error('Failed to list top scores for game.');
    }
};
