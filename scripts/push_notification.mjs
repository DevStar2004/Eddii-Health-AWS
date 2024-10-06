import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import fs from 'fs';

const snsClient = new SNSClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const USER_TABLE = 'user-prod';
const NOTIFICATION_TITLE = 'Introducing eddii-Care 👨‍⚕️';
const NOTIFICATION_MESSAGE =
    'You can now schedule a video consultation with a pediatric endo on eddii. Click on the Care button to book your appointment 👩‍⚕️!';

// Function to send notification
async function sendNotification(topicArn) {
    const params = {
        Message: JSON.stringify({
            default: NOTIFICATION_MESSAGE,
            GCM: JSON.stringify({
                notification: {
                    title: NOTIFICATION_TITLE,
                    body: NOTIFICATION_MESSAGE,
                },
            }),
        }),
        MessageAttributes: {
            destination: {
                DataType: 'String',
                StringValue: 'push',
            },
        },
        MessageStructure: 'json',
        TopicArn: topicArn,
    };

    try {
        const data = await snsClient.send(new PublishCommand(params));
        console.log(`Message sent to ${topicArn}: ${data.MessageId}`);
        return true;
    } catch (error) {
        console.error(`Error sending message to ${topicArn}:`, error);
        return false;
    }
}

// Function to scan DynamoDB for users with TopicArn
async function scanUsersWithTopicArn() {
    const params = {
        TableName: USER_TABLE,
        FilterExpression: 'attribute_not_exists(diabetesInfo)',
        ProjectionExpression: 'email, userTopicArn',
    };

    let allItems = [];
    let lastEvaluatedKey = undefined;

    try {
        do {
            if (lastEvaluatedKey) {
                params.ExclusiveStartKey = lastEvaluatedKey;
            }

            const { Items, LastEvaluatedKey } = await dynamoClient.send(
                new ScanCommand(params),
            );
            allItems = allItems.concat(Items.map(item => unmarshall(item)));
            lastEvaluatedKey = LastEvaluatedKey;
        } while (lastEvaluatedKey);

        return allItems;
    } catch (error) {
        console.error('Error scanning DynamoDB:', error);
        return [];
    }
}

// Function to parse CSV without using csv-parse
function parseCSV(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const values = line.split(',').map(value => value.trim());
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index];
            });
            records.push(record);
        }
    }

    return records;
}

// Main function to read topics and send notifications
async function main() {
    const users = await scanUsersWithTopicArn();

    // Read and parse the input file
    const inputFile = process.argv[2]; // Assuming the file path is passed as a command-line argument
    if (!inputFile) {
        console.error('Please provide the input file path as an argument.');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(inputFile, 'utf-8');
    const records = parseCSV(fileContent);

    // Create a Set of emails from the input file for faster lookup
    const targetEmails = new Set(
        records.map(record => record['$email'].replace(/"/g, '')),
    );

    // Filter users based on the emails from the input file
    const filteredUsers = users.filter(user => targetEmails.has(user.email));

    console.log(
        `Filtered ${filteredUsers.length} users out of ${users.length}`,
    );

    let sentCount = 0;
    for (const user of filteredUsers) {
        const isSuccess = await sendNotification(user.userTopicArn);
        if (isSuccess) sentCount++;
    }

    console.log(`Sent ${sentCount} of ${filteredUsers.length} notifications.`);
}

main().catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
});
