import AWS from 'aws-sdk';

const email = 'soloindyray@yahoo.com'; // Streak is good
const streakTable = 'streak-prod'; // Replace with the actual table name

const today = new Date();
const lastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 4,
    today.getDate(),
);

const startDate = lastMonth.toISOString().split('T')[0];
const endDate = today.toISOString().split('T')[0];

async function addStreak(email, visitedAt) {
    try {
        const dynamoDB = new AWS.DynamoDB.DocumentClient({
            region: process.env['AWS_REGION'] || 'us-east-1',
        });

        const params = {
            TableName: streakTable,
            Item: {
                email: email,
                visitedAt: visitedAt,
            },
        };

        await dynamoDB.put(params).promise();
        console.log(`Streak added for ${email} on ${visitedAt}`);
    } catch (error) {
        console.error('Error adding streak:', error);
    }
}

async function updateLeaderboardStreak(email, streak) {
    try {
        const dynamoDB = new AWS.DynamoDB.DocumentClient({
            region: process.env['AWS_REGION'] || 'us-east-1',
        });

        const params = {
            TableName: 'leaderboard-prod',
            Key: {
                gameId: 'streak',
                email: email,
            },
            UpdateExpression: 'SET score = :streak',
            ExpressionAttributeValues: {
                ':streak': streak,
            },
        };

        await dynamoDB.update(params).promise();
        console.log(`Leaderboard updated for ${email} with streak: ${streak}`);
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

async function checkStreakGaps() {
    try {
        const dynamoDB = new AWS.DynamoDB.DocumentClient({
            region: process.env['AWS_REGION'] || 'us-east-1',
        });

        const params = {
            TableName: streakTable,
            KeyConditionExpression:
                '#email = :email and #visitedAt BETWEEN :start AND :end',
            ExpressionAttributeNames: {
                '#email': 'email',
                '#visitedAt': 'visitedAt',
            },
            ExpressionAttributeValues: {
                ':email': email,
                ':start': startDate,
                ':end': endDate,
            },
        };

        const result = await dynamoDB.query(params).promise();
        const streaks = result.Items || [];

        if (streaks.length === 0) {
            console.log('No streaks found for the given period.');
            return;
        }

        streaks.sort(
            (a, b) =>
                new Date(b.visitedAt).getTime() -
                new Date(a.visitedAt).getTime(),
        );

        let currentStreak = 0;
        let potentialStreak = 0;
        let currentDate = new Date(today);
        let datesToFill = [];

        // Check if there's a streak entry for today
        const todayString = today.toISOString().split('T')[0];
        const hasStreakToday = streaks[0].visitedAt === todayString;
        if (!hasStreakToday) {
            console.log(`No streak today: ${hasStreakToday}`);
            datesToFill.push(todayString);
        }
        for (let i = 0; i < streaks.length; i++) {
            const streakDate = new Date(streaks[i].visitedAt);
            const diffDays = Math.floor(
                (currentDate - streakDate) / (1000 * 60 * 60 * 24),
            );

            if (diffDays === 0 && i === 0) {
                currentStreak++;
                potentialStreak++;
            } else if (diffDays <= 1) {
                currentStreak++;
                potentialStreak++;
            } else if (diffDays === 2) {
                potentialStreak++;
                const missingDate = new Date(
                    streakDate.getTime() + 24 * 60 * 60 * 1000,
                );
                datesToFill.push(missingDate.toISOString().split('T')[0]);
                currentDate = new Date(
                    streakDate.getTime() - 24 * 60 * 60 * 1000,
                );
            } else if (diffDays === 3) {
                potentialStreak++;
                const missingDate1 = new Date(
                    streakDate.getTime() + 24 * 60 * 60 * 1000,
                );
                const missingDate2 = new Date(
                    streakDate.getTime() + 2 * 24 * 60 * 60 * 1000,
                );
                datesToFill.push(missingDate1.toISOString().split('T')[0]);
                datesToFill.push(missingDate2.toISOString().split('T')[0]);
                currentDate = new Date(
                    streakDate.getTime() - 24 * 60 * 60 * 1000,
                );
            } else {
                break;
            }

            currentDate = streakDate;
        }

        console.log(`Current contiguous streak: ${currentStreak} days`);
        console.log(
            `Streak if single and double day gaps were filled: ${potentialStreak} days`,
        );
        if (datesToFill.length > 0) {
            console.log('Dates that need to be filled:');
            datesToFill.forEach(date => console.log(date));
        } else {
            console.log('No dates need to be filled.');
        }

        // Call addToStreak for all dates to fill
        for (const dateToFill of datesToFill) {
            await addStreak(email, dateToFill);
            console.log(`Added streak for date: ${dateToFill}`);
        }

        //// Update the leaderboard with the potential streak
        await updateLeaderboardStreak(email, potentialStreak);
    } catch (error) {
        console.error('Error checking streak gaps:', error);
    }
}

checkStreakGaps();
