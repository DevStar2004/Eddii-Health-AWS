import { getDynamoClient } from '../../aws';
import { Quiz, QuestionType, QuizStatus } from './quiz-model';
import { t } from '@eddii-backend/translate';

const quizzes: { [key: string]: Quiz } = {
    quiz1: {
        quizId: 'quiz1',
        questions: [
            {
                questionId: '1',
                type: QuestionType.IMAGE,
                question: t('Pasta, cooked: serving - 1 cup'),
                possibleAnswers: [55, 45, 35],
                correctAnswers: [45],
            },
            {
                questionId: '2',
                type: QuestionType.IMAGE,
                question: t('Nuts, mixed: serving - 1/2 cup'),
                possibleAnswers: [5, 25, 15],
                correctAnswers: [15],
            },
            {
                questionId: '3',
                type: QuestionType.IMAGE,
                question: t('Yogurt, plain: serving - 1 cup'),
                possibleAnswers: [14, 20, 5],
                correctAnswers: [14],
            },
            {
                questionId: '4',
                type: QuestionType.IMAGE,
                question: t('Apple: serving - 1 medium (tennis ball)'),
                possibleAnswers: [20, 30, 40],
                correctAnswers: [30],
            },
            {
                questionId: '5',
                type: QuestionType.IMAGE,
                question: t('Banana: serving - 1 medium'),
                possibleAnswers: [17, 37, 27],
                correctAnswers: [27],
            },
            {
                questionId: '6',
                type: QuestionType.IMAGE,
                question: t('Orange: serving - 1 medium'),
                possibleAnswers: [5, 15, 25],
                correctAnswers: [15],
            },
            {
                questionId: '7',
                type: QuestionType.IMAGE,
                question: t('Bacon: serving - 3 slices'),
                possibleAnswers: [10, 0, 5],
                correctAnswers: [0],
            },
            {
                questionId: '8',
                type: QuestionType.IMAGE,
                question: t('Eggs: serving - whole'),
                possibleAnswers: [1, 3, 5],
                correctAnswers: [1],
            },
            {
                questionId: '9',
                type: QuestionType.IMAGE,
                question: t('Bagel: serving - 1 unit'),
                possibleAnswers: [48, 28, 38],
                correctAnswers: [38],
            },
            {
                questionId: '10',
                type: QuestionType.IMAGE,
                question: t('Bread, white: serving - 1 slice'),
                possibleAnswers: [12, 20, 0],
                correctAnswers: [12],
            },
            {
                questionId: '11',
                type: QuestionType.IMAGE,
                question: t('Rice, cooked: serving - 1 cup'),
                possibleAnswers: [45, 35, 55],
                correctAnswers: [45],
            },
            {
                questionId: '12',
                type: QuestionType.IMAGE,
                question: t('Potato, baked: serving - 1 medium (6 oz)'),
                possibleAnswers: [40, 30, 50],
                correctAnswers: [40],
            },
            {
                questionId: '13',
                type: QuestionType.IMAGE,
                question: t('Cherries: serving - 12 units'),
                possibleAnswers: [5, 15, 25],
                correctAnswers: [15],
            },
            {
                questionId: '14',
                type: QuestionType.IMAGE,
                question: t('French Fries: serving - small order'),
                possibleAnswers: [20, 40, 30],
                correctAnswers: [30],
            },
        ],
    },
    quiz2: {
        quizId: 'quiz2',
        questions: [
            {
                questionId: '1',
                type: QuestionType.IMAGE,
                question: t('Popcorn: serving - 3 cups'),
                possibleAnswers: [15, 5, 25],
                correctAnswers: [15],
            },
            {
                questionId: '2',
                type: QuestionType.IMAGE,
                question: t('Potato Chips: serving - 1 oz'),
                possibleAnswers: [5, 25, 15],
                correctAnswers: [15],
            },
            {
                questionId: '3',
                type: QuestionType.IMAGE,
                question: t('Artichoke: serving - 1 unit'),
                possibleAnswers: [24, 44, 34],
                correctAnswers: [34],
            },
            {
                questionId: '4',
                type: QuestionType.IMAGE,
                question: t('Carrots, cooked: serving - 1 cup'),
                possibleAnswers: [16, 6, 26],
                correctAnswers: [16],
            },
            {
                questionId: '5',
                type: QuestionType.IMAGE,
                question: t('Cheese, cheddar: serving - 1 oz'),
                possibleAnswers: [0, 5, 3],
                correctAnswers: [0],
            },
            {
                questionId: '6',
                type: QuestionType.IMAGE,
                question: t('Ice cream, vanilla: serving - 1 cup'),
                possibleAnswers: [22, 32, 42],
                correctAnswers: [32],
            },
            {
                questionId: '7',
                type: QuestionType.IMAGE,
                question: t('Pork chop: serving - 3 oz'),
                possibleAnswers: [0, 5, 7],
                correctAnswers: [0],
            },
            {
                questionId: '8',
                type: QuestionType.IMAGE,
                question: t('Turkey breast: serving - 3 oz'),
                possibleAnswers: [0, 3, 5],
                correctAnswers: [0],
            },
            {
                questionId: '9',
                type: QuestionType.IMAGE,
                question: t('Cereal, bran flakes: serving - 1 cup'),
                possibleAnswers: [12, 22, 32],
                correctAnswers: [22],
            },
            {
                questionId: '10',
                type: QuestionType.IMAGE,
                question: t('English muffin: serving - 1 muffin'),
                possibleAnswers: [16, 26, 36],
                correctAnswers: [26],
            },
            {
                questionId: '11',
                type: QuestionType.IMAGE,
                question: t('Waffles: serving - 1 7" waffle'),
                possibleAnswers: [15, 35, 25],
                correctAnswers: [25],
            },
            {
                questionId: '12',
                type: QuestionType.IMAGE,
                question: t('Peas: serving - 1 cup'),
                possibleAnswers: [13, 23, 33],
                correctAnswers: [23],
            },
            {
                questionId: '13',
                type: QuestionType.IMAGE,
                question: t('Spinach: serving - 1 cup'),
                possibleAnswers: [7, 5, 10],
                correctAnswers: [7],
            },
            {
                questionId: '14',
                type: QuestionType.IMAGE,
                question: t('Broccoli: serving - 1 cup'),
                possibleAnswers: [5, 15, 8],
                correctAnswers: [8],
            },
        ],
    },
    quiz3: {
        quizId: 'quiz3',
        questions: [
            {
                questionId: '1',
                type: QuestionType.TEXT,
                question: t('What is glucose?'),
                possibleAnswers: [
                    t('Red blood cells'),
                    t('Sugar that is in the blood'),
                    t('A weird type of glue'),
                ],
                correctAnswers: [t('Sugar that is in the blood')],
            },
            {
                questionId: '2',
                type: QuestionType.TEXT,
                question: t('Why does your body need glucose?'),
                possibleAnswers: [
                    t('To help fight monsters'),
                    t('To increase sleep'),
                    t('For energy'),
                ],
                correctAnswers: [t('For energy')],
            },
            {
                questionId: '3',
                type: QuestionType.TEXT,
                question: t(
                    'What is the word for when your blood glucose is high?',
                ),
                possibleAnswers: [
                    t('Hyperglycemia'),
                    t('Hyperactive'),
                    t('Hippopotamus'),
                ],
                correctAnswers: [t('Hyperglycemia')],
            },
            {
                questionId: '4',
                type: QuestionType.TEXT,
                question: t(
                    'What is the word for when your blood glucose is low?',
                ),
                possibleAnswers: [
                    t('Hypoglycogen'),
                    t('Hypoglycemia'),
                    t('Hypoactive'),
                ],
                correctAnswers: [t('Hypoglycemia')],
            },
            {
                questionId: '5',
                type: QuestionType.TEXT,
                question: t('What is HbA1c?'),
                possibleAnswers: [
                    t("eddii's phone password"),
                    t('A type of insulin to treat diabetes'),
                    t(
                        'A type of protein called hemoglobin that sticks to your blood glucose',
                    ),
                ],
                correctAnswers: [
                    t(
                        'A type of protein called hemoglobin that sticks to your blood glucose',
                    ),
                ],
            },
            {
                questionId: '6',
                type: QuestionType.TEXT,
                question: t('What is Hemoglobin?'),
                possibleAnswers: [
                    t('A green goblin'),
                    t(
                        'A protein inside red blood cells that helps transport oxygen',
                    ),
                    t('Another word for glycogen'),
                ],
                correctAnswers: [
                    t(
                        'A protein inside red blood cells that helps transport oxygen',
                    ),
                ],
            },
            {
                questionId: '7',
                type: QuestionType.TEXT,
                question: t('What is time-in-range (TIR)?'),
                possibleAnswers: [
                    t('The amount of time your glucose is good '),
                    t(
                        'The amount of time it takes eddii to run and finish a lap',
                    ),
                    t(
                        'The amount of time your glucose is above your target range',
                    ),
                ],
                correctAnswers: [t('The amount of time your glucose is good ')],
            },
            {
                questionId: '8',
                type: QuestionType.TEXT,
                question: t(
                    'What happens to your HbA1c when you improve your time-in-range?',
                ),
                possibleAnswers: [
                    t('No change'),
                    t('HbA1c decreases'),
                    t('HbA1c gets better'),
                ],
                correctAnswers: [t('HbA1c gets better')],
            },
            {
                questionId: '9',
                type: QuestionType.TEXT,
                question: t('What does TIR stand for?'),
                possibleAnswers: [
                    t('Taking in rest'),
                    t('Time in range'),
                    t('Time in recovery'),
                ],
                correctAnswers: [t('Time in range')],
            },
            {
                questionId: '10',
                type: QuestionType.TEXT,
                question: t(
                    'Hormones are special chemicals your body makes to help it do certain things- like grow up!',
                ),
                possibleAnswers: [t('True'), t('False')],
                correctAnswers: [t('True')],
            },
            {
                questionId: '11',
                type: QuestionType.TEXT,
                question: t(
                    'Insulin is a hormone that lowers the level of glucose (sugar) in your blood',
                ),
                possibleAnswers: [t('True'), t('False')],
                correctAnswers: [t('True')],
            },
        ],
    },
    quiz4: {
        quizId: 'quiz4',
        questions: [
            {
                questionId: '1',
                type: QuestionType.TEXT,
                question: t('What does it mean to “bolus”?'),
                possibleAnswers: [
                    t('It is the feeling I get after eating too much food'),
                    t(
                        'An insulin dose to help my blood sugar from getting too high, like before eating',
                    ),
                    t('It is when I get all the carbohydrates count right'),
                ],
                correctAnswers: [
                    t(
                        'An insulin dose to help my blood sugar from getting too high, like before eating',
                    ),
                ],
            },
            {
                questionId: '2',
                type: QuestionType.TEXT,
                question: t('When do you bolus?'),
                possibleAnswers: [
                    t('Before a meal'),
                    t('Before a snack'),
                    t('When my blood sugar has been high for a while'),
                    t('All of the above'),
                ],
                correctAnswers: [t('All of the above')],
            },
            {
                questionId: '3',
                type: QuestionType.TEXT,
                question: t('How is bolus given?'),
                possibleAnswers: [
                    t('It is given as a shot or through an insulin pump'),
                    t('Through eating food'),
                    t('None of the above'),
                ],
                correctAnswers: [
                    t('It is given as a shot or through an insulin pump'),
                ],
            },
            {
                questionId: '4',
                type: QuestionType.TEXT,
                question: t(
                    'What do you call the period in which a person with diabetes seems to get better?',
                ),
                possibleAnswers: [
                    t('Pre-diabetes period'),
                    t('Honeymoon period'),
                    t('Low-insulin period'),
                ],
                correctAnswers: [t('Honeymoon period')],
            },
            {
                questionId: '5',
                type: QuestionType.TEXT,
                question: t('What happens after the honeymoon period?'),
                possibleAnswers: [
                    t('A married couple comes back from their trip'),
                    t('The bees no longer have any honey'),
                    t('Your pancreas can no longer produce enough insulin'),
                ],
                correctAnswers: [
                    t('Your pancreas can no longer produce enough insulin'),
                ],
            },
            {
                questionId: '6',
                type: QuestionType.TEXT,
                question: t('How can you manage your diabetes better?'),
                possibleAnswers: [
                    t('Keep track of your glucose'),
                    t('Stay active and exercise regularly'),
                    t('Eat your meals on time'),
                    t('All of the above'),
                ],
                correctAnswers: [t('All of the above')],
            },
            {
                questionId: '7',
                type: QuestionType.TEXT,
                question: t(
                    'Which one of the following is considered free food?',
                ),
                possibleAnswers: [
                    t('A food or drink with no more than 20 calories'),
                    t('A food or drink with less than 5 grams of carbohydrate'),
                    t('My parents buying me food when we go out'),
                    t('Both A and B'),
                ],
                correctAnswers: [t('Both A and B')],
            },
            {
                questionId: '8',
                type: QuestionType.TEXT,
                question: t(
                    'What should you do when you have a low blood glucose?',
                ),
                possibleAnswers: [
                    t('Eat something sweet'),
                    t('Drink something sweet'),
                    t('All of the above'),
                ],
                correctAnswers: [t('All of the above')],
            },
            {
                questionId: '9',
                type: QuestionType.TEXT,
                question: t('Where is insulin produced in your body?'),
                possibleAnswers: [t('Pancreas'), t('Blood cells'), t('Liver')],
                correctAnswers: [t('Pancreas')],
            },
            {
                questionId: '10',
                type: QuestionType.TEXT,
                question: t(
                    'Diabetes is caused by two things, one is insulin. What is the other?',
                ),
                possibleAnswers: [
                    t('Blood sugar'),
                    t('Calcium'),
                    t('Lack of sleep'),
                ],
                correctAnswers: [t('Blood sugar')],
            },
            {
                questionId: '11',
                type: QuestionType.TEXT,
                question: t(
                    'What word describes sugar that is made up of carbon, hydrogen, and oxygen?',
                ),
                possibleAnswers: [
                    t('Carbohydrates'),
                    t('Calories'),
                    t('Protein'),
                    t('Fats'),
                    t('None of the above'),
                ],
                correctAnswers: [t('Carbohydrates')],
            },
            {
                questionId: '12',
                type: QuestionType.TEXT,
                question: t(
                    'High blood glucose can make you feel thirsty, tired, or like peeing a lot.',
                ),
                possibleAnswers: [t('True'), t('False')],
                correctAnswers: [t('True')],
            },
            {
                questionId: '13',
                type: QuestionType.TEXT,
                question: t(
                    'Low blood glucose can make your heart beat stronger, hungry, shaky, or sweaty.',
                ),
                possibleAnswers: [t('True'), t('False')],
                correctAnswers: [t('True')],
            },
            {
                questionId: '14',
                type: QuestionType.TEXT,
                question: t('What is the international symbol for diabetes?'),
                possibleAnswers: [
                    t('A red heart'),
                    t('A blue circle'),
                    t('A yellow star'),
                    t("eddii's hello"),
                ],
                correctAnswers: [t('A blue circle')],
            },
            {
                questionId: '15',
                type: QuestionType.TEXT,
                question: t('What is carb counting?'),
                possibleAnswers: [
                    t(
                        'It is the tracking of carbs in all your meals, snacks, and drinks',
                    ),
                    t('It is when crabs count by clicking their claws'),
                    t('It is the tracking of carbs in only sugar-related food'),
                ],
                correctAnswers: [
                    t(
                        'It is the tracking of carbs in all your meals, snacks, and drinks',
                    ),
                ],
            },
            {
                questionId: '16',
                type: QuestionType.TEXT,
                question: t('Is diabetes contagious?'),
                possibleAnswers: [
                    t('No, definitely not'),
                    t('Maybe'),
                    t('Yes'),
                ],
                correctAnswers: [t('No, definitely not')],
            },
        ],
    },
    quiz5: {
        quizId: 'quiz5',
        questions: [
            {
                questionId: '1',
                type: QuestionType.TEXT,
                question: t('How can you manage your fruit intake?'),
                possibleAnswers: [
                    t('Carb-counting'),
                    t('Not eating any fruits'),
                    t('It does not matter'),
                ],
                correctAnswers: [t('Carb-counting')],
            },
            {
                questionId: '2',
                type: QuestionType.TEXT,
                question: t('How does fruit affect your blood glucose?'),
                possibleAnswers: [
                    t('Causes glucose levels to rise'),
                    t('Causes glucose levels to fall'),
                    t('Gives you superpowers'),
                ],
                correctAnswers: [t('Causes glucose levels to rise')],
            },
            {
                questionId: '3',
                type: QuestionType.IMAGE,
                question: t(
                    'Which fruits have the lowest impact on your sugar levels?',
                ),
                possibleAnswers: [
                    t('Berries and Apples'),
                    t('Fruit juice and Pineapples'),
                    t('Kiwis and Peaches'),
                    t('Both A and C'),
                ],
                correctAnswers: [t('Both A and C')],
            },
            {
                questionId: '4',
                type: QuestionType.IMAGE,
                question: t(
                    'Which fruits have a higher impact on your sugar levels?',
                ),
                possibleAnswers: [
                    t('Oranges'),
                    t('Grapes'),
                    t('Apricot'),
                    t('Both A and B'),
                ],
                correctAnswers: [t('Both A and B')],
            },
            {
                questionId: '5',
                type: QuestionType.TEXT,
                question: t('How can I better manage diabetes?'),
                possibleAnswers: [
                    t('Count carbs'),
                    t("Don't skip meals"),
                    t('Eat healthy foods'),
                    t('Be physically active'),
                    t('All of the above'),
                ],
                correctAnswers: [t('All of the above')],
            },
            {
                questionId: '6',
                type: QuestionType.TEXT,
                question: t(
                    'Why is it important to eat fruits even though they are full of carbohydrates?',
                ),
                possibleAnswers: [
                    t('Fruits are rich in fiber, vitamins, and minerals'),
                    t('It makes eddii smile'),
                ],
                correctAnswers: [
                    t('Fruits are rich in fiber, vitamins, and minerals'),
                ],
            },
            {
                questionId: '7',
                type: QuestionType.TEXT,
                question: t('What are non-starchy vegetables?'),
                possibleAnswers: [
                    t('Vegetables low in calories and low in carbohydrates'),
                    t('Vegetables high in calories'),
                    t("eddii's favorite types of vegetables"),
                ],
                correctAnswers: [
                    t('Vegetables low in calories and low in carbohydrates'),
                ],
            },
            {
                questionId: '8',
                type: QuestionType.IMAGE,
                question: t(
                    'What are good travel foods for people with diabetes?',
                ),
                possibleAnswers: [
                    t('Chips'),
                    t('Glucose tablets for when you are low'),
                    t('Mixed unsweetened nuts'),
                    t('Both B & C'),
                ],
                correctAnswers: [t('Both B & C')],
            },
            {
                questionId: '9',
                type: QuestionType.IMAGE,
                question: t(
                    'Which of the following drinks are a healthy option to drink?',
                ),
                possibleAnswers: [
                    t('Water'),
                    t('Milk'),
                    t('Tea'),
                    t('All of the above'),
                ],
                correctAnswers: [t('All of the above')],
            },
            {
                questionId: '10',
                type: QuestionType.IMAGE,
                question: t(
                    'Which of the following are examples of carbohydrates?',
                ),
                possibleAnswers: [
                    t('Bread'),
                    t('Pasta'),
                    t('Chicken'),
                    t('Both A & B'),
                ],
                correctAnswers: [t('Both A & B')],
            },
            {
                questionId: '11',
                type: QuestionType.IMAGE,
                question: t(
                    'Which of the following food does not contain carbohydrates?',
                ),
                possibleAnswers: [
                    t('Chicken'),
                    t('Carrots'),
                    t('Bread'),
                    t('Apple Juice'),
                ],
                correctAnswers: [t('Chicken')],
            },
        ],
    },
};

export const getQuiz = (quizId: string): Quiz | undefined => {
    return quizzes[quizId];
};

export const updateCorrectQuestionForQuiz = async (
    email: string,
    quizId: string,
    correctQuestionId: string,
): Promise<QuizStatus | undefined> => {
    if (!quizId || !email || !correctQuestionId) {
        throw new Error(
            'Email and QuizID and Correct Question ID are required.',
        );
    }
    console.log(
        `Updating quiz status for ${quizId}-${correctQuestionId} for email: ${email}`,
    );
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['QUIZ_TABLE_NAME'] as string,
        Key: {
            email: email,
            quizId: quizId,
        },
        UpdateExpression: 'ADD correctQuestionIds :correctQuestionIds',
        ExpressionAttributeValues: {
            ':correctQuestionIds': ddbDocClient.createSet([correctQuestionId]),
        },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const response = await ddbDocClient.update(params).promise();
        const quizStatus: any = response.Attributes;
        if (quizStatus.correctQuestionIds) {
            quizStatus.correctQuestionIds =
                quizStatus.correctQuestionIds.values;
        } else {
            quizStatus.correctQuestionIds = [];
        }
        return quizStatus as QuizStatus;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(
            `Updating quiz status for ${quizId}-${correctQuestionId} for email: ${email}`,
            error,
        );
        throw new Error('Error updating quiz status.');
    }
};

export const getQuizStatus = async (
    email: string,
    quizId: string,
): Promise<QuizStatus | undefined> => {
    if (!quizId || !email) {
        throw new Error('Email and QuizID are required.');
    }
    console.log(`Getting quiz status for ${quizId} for email: ${email}`);
    const ddbDocClient = getDynamoClient();
    const params = {
        TableName: process.env['QUIZ_TABLE_NAME'] as string,
        Key: {
            email: email,
            quizId: quizId,
        },
    };
    try {
        const response = await ddbDocClient.get(params).promise();
        if (!response.Item) {
            return undefined;
        }
        const quizStatus: any = response.Item;
        if (quizStatus.correctQuestionIds) {
            quizStatus.correctQuestionIds =
                quizStatus.correctQuestionIds.values;
        } else {
            quizStatus.correctQuestionIds = [];
        }
        return quizStatus as QuizStatus;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(
            `Getting quiz status for ${quizId} for email: ${email}`,
            error,
        );
        throw new Error('Error getting quiz status.');
    }
};
