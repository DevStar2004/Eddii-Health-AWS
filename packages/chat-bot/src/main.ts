import { LexV2Event, LexV2Message, LexV2Result } from 'aws-lambda';
import { getGreeting } from './lib/greeting';
import { getJoke, getPunchline } from './lib/joke';
import FuzzySet from 'fuzzyset';
import { getSpecificStory, getStory } from './lib/story';
import { getMeditation, getSpecificMeditation } from './lib/meditation';
import { getData, getCBTLength } from './lib/cbt';
import { getFallback } from './lib/fallback';
import { getFeelingsResponse } from './lib/feelings';

const feelingOptions = [
    { text: '😊', value: 'Happy' },
    { text: '😫', value: 'Upset' },
    { text: '😐', value: 'Neutral' },
    { text: '😭', value: 'Sad' },
    { text: '🤒', value: 'Sick' },
];

export const handler = async (event: LexV2Event): Promise<LexV2Result> => {
    console.log('event', JSON.stringify(event, null, 2));

    const sessionStateIntentName = event.sessionState.intent?.name || '';
    const sessionAttributes = event.sessionState.sessionAttributes || {};
    // Setup chat history which is an array of at most 5 previous messages
    const chatHistory: string[] = sessionAttributes['CHAT_HISTORY']
        ? JSON.parse(sessionAttributes['CHAT_HISTORY'])
        : [];

    if (event.inputTranscript) {
        chatHistory.push(event.inputTranscript);
    }
    if (chatHistory.length > 5) {
        chatHistory.shift();
    }

    sessionAttributes['CHAT_HISTORY'] = JSON.stringify(chatHistory);
    if (sessionStateIntentName === 'FallbackIntent') {
        const content = await getFallback(chatHistory);
        return {
            sessionState: {
                sessionAttributes: sessionAttributes,
                intent: {
                    name: event.sessionState.intent.name,
                    state: 'Fulfilled',
                },
                dialogAction: {
                    type: 'Close',
                },
            },
            messages: [
                {
                    contentType: 'PlainText',
                    content: content,
                },
            ],
        };
    } else if (sessionStateIntentName === 'Greeting') {
        const content = getGreeting();
        return {
            sessionState: {
                sessionAttributes: sessionAttributes,
                intent: {
                    name: event.sessionState.intent.name,
                    state: 'Fulfilled',
                },
                dialogAction: {
                    type: 'Close',
                },
            },
            messages: [
                {
                    contentType: 'PlainText',
                    content,
                },
                // {
                //     contentType: 'ImageResponseCard',
                //     imageResponseCard: {
                //         title: 'How are you feeling today?',
                //         buttons: feelingOptions
                //     },
                // },
            ],
        };
    } else if (sessionStateIntentName === 'Joke') {
        const confirmationState =
            event.sessionState.intent.confirmationState || 'None';

        if (confirmationState === 'Denied') {
            return {
                sessionState: {
                    sessionAttributes: {
                        ...sessionAttributes,
                        JOKE_INDEX: undefined,
                    },
                    intent: {
                        name: event.sessionState.intent.name,
                        state: 'Failed',
                    },
                    dialogAction: {
                        type: 'Close',
                    },
                },
                messages: [
                    {
                        contentType: 'PlainText',
                        content:
                            'No problem! Let me know if you want to hear a joke later.',
                    },
                ],
            };
        } else if (sessionAttributes['JOKE_INDEX'] === undefined) {
            // Starting joke.
            const joke = getJoke();
            sessionAttributes['JOKE_INDEX'] = joke.index.toString();
            return {
                sessionState: {
                    sessionAttributes: sessionAttributes,
                    intent: {
                        name: event.sessionState.intent.name,
                        state: 'InProgress',
                    },
                    dialogAction: {
                        type: 'ElicitSlot',
                        slotToElicit: 'Guess',
                        slotElicitationStyle: 'Default',
                    },
                },
                messages: [
                    {
                        contentType: 'PlainText',
                        content: joke.joke,
                    },
                ],
            };
        } else {
            const guess = event.sessionState.intent.slots?.Guess?.value?.originalValue || '';
            const punchline = getPunchline(
                parseInt(sessionAttributes['JOKE_INDEX']),
            );
            const answer = FuzzySet([punchline.toLowerCase()]);
            let response = punchline;
            const closestMatch = answer.get(guess.toLowerCase());
            if (
                closestMatch &&
                closestMatch.length > 0 &&
                closestMatch[0][0] > 0.8
            ) {
                response = 'Awesome! You guessed it right!';
            }
            return {
                sessionState: {
                    sessionAttributes: {
                        ...sessionAttributes,
                        JOKE_INDEX: undefined,
                    },
                    intent: {
                        name: event.sessionState.intent.name,
                        state: 'Fulfilled',
                    },
                    dialogAction: {
                        type: 'ConfirmIntent',
                    },
                },
                messages: [
                    {
                        contentType: 'PlainText',
                        content: response,
                    },
                    {
                        contentType: 'PlainText',
                        content: 'Want another joke?',
                    },
                ],
            };
        }
    } else if (sessionStateIntentName === 'Story') {
        const confirmationState =
            event.sessionState.intent.confirmationState || 'None';
        const storyResponse =
            event.sessionState.intent.slots?.StoryResponse?.value
                ?.originalValue || '';

        if (
            confirmationState === 'Denied' ||
            storyResponse.toLowerCase() === 'end story'
        ) {
            return {
                sessionState: {
                    sessionAttributes: {
                        ...sessionAttributes,
                        STORY_INDEX: undefined,
                        STORY_PART_INDEX: undefined,
                    },
                    intent: {
                        name: event.sessionState.intent.name,
                        state: 'Failed',
                    },
                    dialogAction: {
                        type: 'Close',
                    },
                },
                messages: [
                    {
                        contentType: 'PlainText',
                        content:
                            'No problem! Let me know if you want to hear a story later.',
                    },
                ],
            };
        }

        let story: {
            content: string;
            imageUrl?: string;
            options: string[];
        }[];
        let storyPartIndex: number;
        if (
            sessionAttributes['STORY_INDEX'] === undefined &&
            sessionAttributes['STORY_PART_INDEX'] === undefined
        ) {
            // Starting story.
            const randomStory = getStory();
            story = randomStory.story;
            storyPartIndex = 0;
            sessionAttributes['STORY_INDEX'] = randomStory.index.toString();
        } else {
            story = getSpecificStory(
                parseInt(sessionAttributes['STORY_INDEX']),
            );
            storyPartIndex = parseInt(sessionAttributes['STORY_PART_INDEX']);
        }

        const messages: LexV2Message[] = [];
        if (storyPartIndex < story.length) {
            sessionAttributes['STORY_PART_INDEX'] = (
                storyPartIndex + 1
            ).toString();
            messages.push({
                contentType: 'ImageResponseCard',
                imageResponseCard: {
                    title: story[storyPartIndex].content,
                    imageUrl: story[storyPartIndex].imageUrl,
                    buttons: story[storyPartIndex].options.map(option => ({
                        text: option,
                        value: option,
                    })),
                },
            });
        } else {
            sessionAttributes['STORY_INDEX'] = undefined;
            sessionAttributes['STORY_PART_INDEX'] = undefined;
            messages.push({
                contentType: 'PlainText',
                content: 'The end 🎭 Want to hear another story?',
            });
        }

        return {
            sessionState: {
                sessionAttributes: sessionAttributes,
                intent: {
                    name: event.sessionState.intent.name,
                    state:
                        storyPartIndex >= story.length
                            ? 'Fulfilled'
                            : 'InProgress',
                },
                dialogAction:
                    storyPartIndex >= story.length
                        ? {
                            type: 'ConfirmIntent',
                        }
                        : {
                            type: 'ElicitSlot',
                            slotToElicit: 'StoryResponse',
                            slotElicitationStyle: 'Default',
                        },
            },
            messages: messages,
        };
    } else if (sessionStateIntentName === 'Meditation') {
        const confirmationState =
            event.sessionState.intent.confirmationState || 'None';

        if (confirmationState === 'Denied') {
            return {
                sessionState: {
                    sessionAttributes: {
                        ...sessionAttributes,
                        MEDITATION_INDEX: undefined,
                        MEDITATION_PART_INDEX: undefined,
                    },
                    intent: {
                        name: event.sessionState.intent.name,
                        state: 'Failed',
                    },
                    dialogAction: {
                        type: 'Close',
                    },
                },
                messages: [
                    {
                        contentType: 'PlainText',
                        content:
                            'No problem! Let me know if you want to meditate later.',
                    },
                ],
            };
        }

        let meditation: {
            content: string;
            imageUrl?: string;
            options: string[];
        }[];
        let meditationPartIndex: number;
        if (
            sessionAttributes['MEDITATION_INDEX'] === undefined &&
            sessionAttributes['MEDITATION_PART_INDEX'] === undefined
        ) {
            // Starting meditation.
            const randomMeditation = getMeditation();
            meditation = randomMeditation.meditation;
            meditationPartIndex = 0;
            sessionAttributes['MEDITATION_INDEX'] =
                randomMeditation.index.toString();
        } else {
            meditation = getSpecificMeditation(
                parseInt(sessionAttributes['MEDITATION_INDEX']),
            );
            meditationPartIndex = parseInt(
                sessionAttributes['MEDITATION_PART_INDEX'],
            );
        }

        const messages: LexV2Message[] = [];
        if (meditationPartIndex < meditation.length) {
            sessionAttributes['MEDITATION_PART_INDEX'] = (
                meditationPartIndex + 1
            ).toString();
            messages.push({
                contentType: 'ImageResponseCard',
                imageResponseCard: {
                    title: meditation[meditationPartIndex].content,
                    imageUrl: meditation[meditationPartIndex].imageUrl,
                    buttons: meditation[meditationPartIndex].options.map(
                        option => ({
                            text: option,
                            value: option,
                        }),
                    ),
                },
            });
        } else {
            sessionAttributes['MEDITATION_INDEX'] = undefined;
            sessionAttributes['MEDITATION_PART_INDEX'] = undefined;
            messages.push({
                contentType: 'PlainText',
                content: 'Finished! Want to try it again?',
            });
        }

        return {
            sessionState: {
                sessionAttributes: sessionAttributes,
                intent: {
                    name: event.sessionState.intent.name,
                    state:
                        meditationPartIndex >= meditation.length
                            ? 'Fulfilled'
                            : 'InProgress',
                },
                dialogAction:
                    meditationPartIndex >= meditation.length
                        ? {
                            type: 'ConfirmIntent',
                        }
                        : {
                            type: 'ElicitSlot',
                            slotToElicit: 'MeditationResponse',
                            slotElicitationStyle: 'Default',
                        },
            },
            messages: messages,
        };
    } else if (sessionStateIntentName === 'Feelings') {
        const confirmationState = event.sessionState.intent.confirmationState || 'None';
        const feelingResponse = event.sessionState.intent.slots?.FeelingsResponse?.value?.originalValue;

        // const activityChoice = event.sessionState.intent.slots?.ActivityChoice?.value?.originalValue;

        if (confirmationState === 'Denied') {
            return {
                sessionState: {
                    sessionAttributes: {
                        ...sessionAttributes,
                        FEELING_INDEX: undefined,
                    },
                    intent: {
                        name: event.sessionState.intent.name,
                        state: 'Failed',
                    },
                    dialogAction: {
                        type: 'Close',
                    },
                },
                messages: [
                    {
                        contentType: 'PlainText',
                        content:
                            'No problem! Let me know if you want to chat about your feelings later.',
                    },
                ],
            };
        }
        // Starting feeling flow, ask how they are feeling.
        if (
            feelingResponse === undefined &&
            sessionAttributes['FEELING_INDEX'] === undefined
        ) {
            return {
                sessionState: {
                    sessionAttributes: sessionAttributes,
                    intent: {
                        name: event.sessionState.intent.name,
                        state: 'InProgress',
                    },
                    dialogAction: {
                        type: 'ElicitSlot',
                        slotToElicit: 'FeelingsResponse',
                        slotElicitationStyle: 'Default',
                    },
                },
                messages: [
                    {
                        contentType: 'ImageResponseCard',
                        imageResponseCard: {
                            title: 'How are you feeling right now?',
                            buttons: feelingOptions,
                        },
                    },
                ],
            };
        }

        const messages: LexV2Message[] = [];

        let feelingIndex: number = parseInt(sessionAttributes['FEELING_INDEX']) || 0;
        let feeling: string = sessionAttributes['FEELING'] || feelingResponse || '';

        if (sessionAttributes['FEELING_INDEX'] === undefined) {
            if (
                feelingResponse &&
                feelingOptions.some(
                    option =>
                        option.value.toLowerCase() ===
                        feelingResponse.toLowerCase(),
                )
            ) {
                if (feelingResponse.toLowerCase() === 'sad') {
                    messages.push({
                        contentType: 'PlainText',
                        content: 'I am sorry to hear that. We all have bad days sometimes.'
                    })
                }
                sessionAttributes['FEELING'] = feelingResponse;
            }
        }

        const feelings = getFeelingsResponse(feeling.toLowerCase());

        messages.push({
            contentType: 'ImageResponseCard',
            imageResponseCard: {
                title: feelings[feelingIndex].content,
                imageUrl: feelings[feelingIndex].imageUrl,
                buttons: feelings[feelingIndex].options.map(option => ({
                    text: option,
                    value: option
                })),
            }
        });
        feelingIndex += 1;
        sessionAttributes['FEELING_INDEX'] = feelingIndex.toString();

        //Init the value of FEELING_INDEX
        if (feelingIndex >= feelings.length) {
            sessionAttributes['FEELING_INDEX'] = undefined;
            sessionAttributes['FEELING'] = undefined;
        }
        return {
            sessionState: {
                sessionAttributes: sessionAttributes,
                intent: {
                    name: event.sessionState.intent.name,
                    state:
                        feelingIndex >= feelings.length ? 'Fulfilled' : 'InProgress',
                },
                dialogAction:
                    feelingIndex >= feelings.length
                        ? {
                            type: 'Close',
                        }
                        : {
                            type: 'ElicitSlot',
                            slotToElicit: 'ActivityChoice',
                            slotElicitationStyle: 'Default',
                        },
            },
            messages: messages,
        };
    } else if (sessionStateIntentName === 'CBT') {
        const confirmationState = event.sessionState.intent.confirmationState || 'None';
        const activityChoice: string = event.sessionState.intent.slots?.ActivityChoice?.value?.originalValue || '';

        let cbtPartIndex: number = parseInt(sessionAttributes['CBT_PART_INDEX']) || 0;
        let prevCbtIndex: number = parseInt(sessionAttributes['PREV_CBT_INDEX']) || -1;
        let cbtIndex: number = parseInt(activityChoice.substring(activityChoice.lastIndexOf('_') + 1)) || 0;

        if (confirmationState === 'Denied' || cbtIndex === -1) {
            return {
                sessionState: {
                    sessionAttributes: {
                        ...sessionAttributes,
                        CBT_PART_INDEX: undefined,
                        PREV_CBT_INDEX: undefined,
                    },
                    intent: {
                        name: event.sessionState.intent.name,
                        state: 'Failed',
                    },
                    dialogAction: {
                        type: 'Close',
                    },
                },
                messages: [
                    {
                        contentType: 'PlainText',
                        content:
                            'No problem! Let me know if you want to my help later.',
                    },
                ],
            };
        }

        if (prevCbtIndex === 26) cbtIndex = 27;
        let data = getData(cbtIndex);
        const cbtLength = getCBTLength();
        const messages: LexV2Message[] = [];

        if (cbtIndex === prevCbtIndex) { // the case for Loop
            cbtPartIndex += 1;
            messages.push({
                contentType: 'PlainText',
                content: data.contents[cbtPartIndex],
            });
            if (data.options.length > 0)
                messages.push({
                    contentType: 'ImageResponseCard',
                    imageResponseCard: {
                        title: 'Select an option',
                        buttons: cbtPartIndex < (data.contents.length - 1) ? data.options
                            : data.options.filter(option => option.text !== 'Give another example')
                    }
                });
            if (cbtPartIndex >= (data.contents.length - 1)) { // No more example data
                cbtPartIndex = -1; // init CBT part index
            }
        }
        else {
            cbtPartIndex = 0;
            if (cbtIndex === 1 || cbtIndex === 11 || cbtIndex === 14 || cbtIndex === 17 || cbtIndex === 20 || cbtIndex === 24) {
                messages.push({
                    contentType: 'PlainText',
                    content: data.contents[cbtPartIndex],
                })

                cbtIndex += 1;
                data = getData(cbtIndex);
            }

            messages.push({
                contentType: 'PlainText',
                content: data.contents[cbtPartIndex]
            });
            if (data.options.length > 0)
                messages.push({
                    contentType: 'ImageResponseCard',
                    imageResponseCard: {
                        title: 'Select an option',
                        buttons: data.options
                    }
                });
        }
        prevCbtIndex = cbtIndex;
        sessionAttributes['PREV_CBT_INDEX'] = prevCbtIndex >= 0 ? prevCbtIndex.toString() : undefined
        sessionAttributes['CBT_PART_INDEX'] = cbtPartIndex > 0 ? cbtPartIndex.toString() : undefined;

        return {
            sessionState: {
                sessionAttributes: sessionAttributes,
                intent: {
                    name: event.sessionState.intent.name,
                    state:
                        cbtIndex >= (cbtLength - 1) ? 'Fulfilled' : 'InProgress',
                },
                dialogAction:
                    cbtIndex >= (cbtLength - 1)
                        ? {
                            type: 'Close',
                        }
                        : {
                            type: 'ElicitSlot',
                            slotToElicit: 'ActivityChoice',
                            slotElicitationStyle: 'Default',
                        },
            },
            messages: messages,
        };
    }
    else {
        throw new Error('Intent not supported');
    }
};
