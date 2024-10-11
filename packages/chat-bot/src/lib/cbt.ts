export const CBT = [
    {
        id: 0,
        content: 'CBT, stands for Cognitive Behavioral Therapy. It means how we think about a situation impacts how we feel and respond',
        options: [
            { text: 'Go on', value: 1, },
            { text: 'Interesting', value: 1 }]
    },
    {
        id: 1,
        content:
            `We are all surrounded by thoughts. Our brains do not like to just sit still! Or minds fill up with thougthts. about the things
             going on around us.
             Our thoughts are pretty powerful. How we think about a situation can have a big impact on how we feel and on how we react.
             This is called the CBT triangle`,
        options: []
    },
    {
        id: 2,
        content: 'Let me give you an example',
        options: [
            { text: 'Ok', value: 2 },
            { text: 'End', value: -1 }
        ],
        examples: [
            [
                {
                    content: `Let's imagine that your blood sugar is high`,
                    options: [
                        { text: 'Ok', value: 2 },
                        { text: 'Go on', value: 2 }
                    ]
                },
                {
                    content: `If you think "This always happens no matter what I do" You are likely to feel frustrated and upset and to give up
                and do nothing about your high blood sugar`,
                    options: [
                        { text: 'Make sense', value: 2 },
                        { text: 'Go on', value: 2 }
                    ]
                },
                {
                    content: `On the other hand, if you think "Oh! There must have been more carbs in that pizza than I thought"
                you might feel a bit upset but also confident you now how to improve and to do things differently ."Next time I eat pizza 
                I will estimate more carbs"`,
                    options: [
                        { text: 'Right', value: 3 },
                        { text: 'Give another example', value: 2 }
                    ]
                },
            ], [
                {
                    content: `Let's imagine that your blood sugar is trending higher than normal today`,
                    options: [
                        { text: 'Ok', value: 2 },
                        { text: 'Go on', value: 2 }
                    ]
                },
                {
                    content: `If you think "It is happening again, my blood sugars are high for no reason whatever. Out of control! I am so bad at 
                    this!" You are likely to feel overwhelmed and stressed.`,
                    options: [
                        { text: 'Make sense', value: 2 },
                        { text: 'Go on', value: 2 }
                    ]
                },
                {
                    content: `Instead, if you think my blood sugars are trending high today. I admit it is stressful and distracting!
                    I've taken all the insulin I'm supposed and tried my best, maybe it's something wrong with my pump and I should try changing 
                    it. I will try and if it doesn't work, I will think of others reasons this might be`,
                    options: [
                        { text: 'Right', value: 3 },
                        { text: 'Give another example', value: 2 }
                    ]
                },
            ], [
                {
                    content: `Imagine if your blood sugars are fluctuating up and down`,
                    options: [
                        { text: 'Ok', value: 2 },
                        { text: 'Go on', value: 2 }
                    ]
                },
                {
                    content: `If you think "My blood sugars are all over the place! This is so stressful! I can never seem to get them to stay in 
                    range. I give up." You are likely to feel helpless and defeated.`,
                    options: [
                        { text: 'Make sense', value: 2 },
                        { text: 'Go on', value: 2 }
                    ]
                },
                {
                    content: `My blood sugars have fluctuated so much today. I admit I am tired of the ups and downs. On the other hand, I can't 
                    control everything all the time and I most of the time I'm in range. Maybe I can make note of things I ate and does I took today,
                    so that I can do a better job next time!`,
                    options: [
                        { text: 'Right', value: 3 },
                        { text: 'Give another example', value: 2 }
                    ]
                },
            ]]
    },
    {
        id: 3,
        content: 'Sometimes we fall into a pattern of negative thinking. But a LOT of negative thoughts are actually "Thinking mistakes" or "traps"',
        options: [
            { text: 'Right', value: 4 },
            { text: 'Give another example-*', value: 2 }
        ]
    },
    {
        id: 4,
        content: 'Would you like to learn more about different kinds of thinking traps?',
        options: [
            { text: 'Yes', value: 5 },
            { text: 'Not right now', value: -1 }
        ]
    },
    {
        id: 5,
        content: 'What would you like to select?',
        options: [
            { text: 'All or nothing thinking', value: 6 },
            { text: 'Catastrophizing', value: 9 },
            { text: 'Mind Reading', value: 11 },
            { text: 'Overresponsibility', value: 13 },
            { text: 'Intolerance of uncertainty', value: 16 }
        ]
    },
    {
        id: 6,
        content: `All or nothing is a thinking trap that involves thinking in extremes, as if there are only two options when things so wrong`,
        options: [
            { text: 'Ok', value: 7 },
            { text: 'Go on', value: 7 }
        ]
    },
    {
        id: 7,
        content: 'All or nothing thinking also relates to perfectionism. For example expecting your blood sugars to always be in range.',
        options: [
            { text: 'Do tell eddii', value: 8 },
        ]
    },
    {
        id: 8,
        content: 'Let me give you an example',
        options: [],
        examples: [
            [
                {
                    content: '"I never count carbs correctly and I am always running high"',
                    options: [
                        { text: 'Give another example', value: 8 },
                        { text: 'Move to next thinking trap', value: 9 }
                    ]
                }
            ], [
                {
                    content: '"I am never going to have a normal life! I will always have shortcomings because of my T1D."',
                    options: [
                        { text: 'Give another example', value: 8 },
                        { text: 'Move to next thinking trap', value: 9 }
                    ]
                }
            ], [
                {
                    content: 'I can never seem to keep my blood sugar in target range. I always overtreat my lows',
                    options: [
                        { text: 'Give another example', value: 8 },
                        { text: 'Move to next thinking trap', value: 9 }
                    ]
                }
            ]
        ]
    },
    {
        id: 9,
        content: 'One thinking trap is Catastrophizing. Catasrtophizing is expecting the worst',
        options: [
            { text: 'Ok', value: 10 },
            { text: 'Go on', value: 10 }
        ]
    },
    {
        id: 10,
        content: 'Let me give you an example',
        options: [],
        examples: [
            [
                {
                    content: 'My blood sugar is high again. There is no way I am going to avoid complications long-term',
                    options: [
                        { text: 'Give another example', value: 10 },
                        { text: 'Move to next thinking trap', value: 11 }
                    ]
                }
            ], [
                {
                    content: 'With all these devices attached to me and my highs and lows, no one is ever going to want to date me',
                    options: [
                        { text: 'Give another example', value: 10 },
                        { text: 'Move to next thinking trap', value: 11 }
                    ]
                }
            ], [
                {
                    content: 'If my blood sugar goes low I will probably pass out and embarrass myself',
                    options: [
                        { text: 'Give another example', value: 10 },
                        { text: 'Move to next thinking trap', value: 11 }
                    ]
                }
            ]
        ]
    },
    {
        id: 11,
        content: `Mind reading assumes we know what other people are thinking and assuming it's probably negative and about us`,
        options: [
            { text: 'Ok', value: 12 },
            { text: 'Go on', value: 12 }
        ]
    },
    {
        id: 12,
        content: 'Let me give you an example',
        options: [],
        examples: [
            [
                {
                    content: 'The doctor is going to see my numbers and think that I am bad at diabetes',
                    options: [
                        { text: 'Give another example', value: 12 },
                        { text: 'Move to next thinking trap', value: 13 }
                    ]
                }
            ], [
                {
                    content: `As soon as someone hears I have disabetes they will think I'm sick and won't want to be friends with me`,
                    options: [
                        { text: 'Give another example', value: 12 },
                        { text: 'Move to next thinking trap', value: 13 }
                    ]
                }
            ], [
                {
                    content: `My colleges view me as a disabled person and unable to perform my job because I live with T1D`,
                    options: [
                        { text: 'Give another example', value: 12 },
                        { text: 'Move to next thinking trap', value: 13 }
                    ]
                }
            ], [
                {
                    content: `The doctor is going to see my numbers and think I don't care.`,
                    options: [
                        { text: 'Give another example', value: 12 },
                        { text: 'Move to next thinking trap', value: 13 }
                    ]
                }
            ]
        ]
    },
    {
        id: 13,
        content: `Overresponsibility ignores other aspects of a situation or the possiblity that other people might be responsible 
        to help us - like our healthcare providers, support system, and eddii`,

        options: [
            { text: 'Ok', value: 14 },
            { text: 'Go on', value: 14 }
        ]
    },
    {
        id: 14,
        content: `When trying to detect this thinking trap, lookout for words like "should, never, always, and have to"`,

        options: [
            { text: 'Ok', value: 15 },
            { text: 'Go on', value: 15 }
        ]
    },
    {
        id: 15,
        content: 'Let me give you an example',
        options: [],
        examples: [
            [
                {
                    content: 'I should always be able to figure out how to exercise without going low every time',
                    options: [
                        { text: 'Give another example', value: 15 },
                        { text: 'Move to next thinking trap', value: 16 }
                    ]
                }
            ], [
                {
                    content: `I should know how to keep my BG in range of most of the time after all these years living with diabetes`,
                    options: [
                        { text: 'Give another example', value: 15 },
                        { text: 'Move to next thinking trap', value: 16 }
                    ]
                }
            ], [
                {
                    content: `I am still getting carb counting wrong and getting spikes. No one to blame but myself`,
                    options: [
                        { text: 'Give another example', value: 15 },
                        { text: 'Move to next thinking trap', value: 16 }
                    ]
                }
            ]
        ]
    },
    {
        id: 16,
        content:
            `Not knowing and not feeling in control makes us anxious. One way we try to get back a sense of control is by expecting the worst or
            catastrophizing. The problem is that then we act accordingly (e.g. treating a low before it even )`,
        options: [
            { text: 'Ok', value: 17 },
            { text: 'Go on', value: 17 }
        ]
    },
    {
        id: 17,
        content: 'Let me give you an example',
        options: [],
        examples: [
            [
                {
                    content: `I just know if I ignore that diagonal down arrow. I'll have a low blood sugar.`,
                    options: [
                        { text: 'Give another example', value: 17 },
                        { text: 'Right', value: 18 }
                    ]
                }
            ], [
                {
                    content: `I have no idea how exercise is going to affect my BG, so best to avoid it altogether.`,
                    options: [
                        { text: 'Give another example', value: 17 },
                        { text: 'Right', value: 18 },
                    ]
                }
            ], [
                {
                    content: `I am not going to change my diet because I dont' know how it will affect my BG.`,
                    options: [
                        { text: 'Give another example', value: 17 },
                        { text: 'Right', value: 18 }
                    ]
                }
            ]
        ]
    },
    {
        id: 18,
        content:
            `Now that you have learned about thinking traps, it's time to have some fun! Let's use some detective thinking
             to see if any of your thoughts about diabetes fall into these traps.
             \n What's your thought?`,
        options: []
    },
    {
        id: 19,
        content: `Is it possible this is a thinking trap?`,
        options: [
            { text: 'Yes', value: 19 },
            { text: 'I need more help', value: 19 }
        ]
    },
    {
        id: 20,
        content: `The good news is that, once we learn to detect thinking traps, we can learn to climb out of them/avoid them all together`,
        options: [
            { text: 'Ok', value: 21 },
            { text: 'Go on', value: 21 }
        ]
    },
    {
        id: 21,
        content:
            `Ask your self these five questions
            1. what evidence supports this unhelpful thought? What is the evidence against it?
            2. what would I say to a friend in my situation?
            3. how have similar situations gone in the past?
            4. how probable somthing is to happen - it may be possible but not probable.
            5. what's the worst thing that could happen? Would you be able to deal with that? how`,
        options: [
            { text: 'All or nothing thinking', value: 22 },
            { text: 'Over generalizing', value: 23 },
            { text: 'Mental Filter', value: 24 },
            { text: 'Disqualifying the positive', value: 25 },
            { text: 'Jumping to conclusions', value: 26 },
            { text: 'Magnification and minimisation', value: 27 },
            { text: 'Emotional reasoning', value: 28 },
            { text: 'SHOULD MUST', value: 29 },
            { text: 'Labeling', value: 30 },
            { text: 'Personalization', value: 31 },
        ]
    },
    {
        id: 22,
        content: `Sometimes called 'All or nothing' thinking For instance, thinkig:
        if I'm not perfect I have failed Either I do it right or not at all`,
        options: []
    },
    {
        id: 23,
        content: `Seeing a pattern based upon a single event, or being overly broad in the conclusion we draw 
        Everything is always rubbish, Nothing good ever happens`,
        options: []
    },
    {
        id: 24,
        content: `Only paying attention to certain types of evidence, Nothing our failures but not seeing our success`,
        options: []
    },
    {
        id: 25,
        content: `Discounting the good things that have happened or that you have done for some reason or another. That doesn't count`,
        options: []
    },
    {
        id: 26,
        content: `There are two key types of jumping to conclusions
        -Mind reading: Imagining we know what others are thinking
        -Fortune teling: predicting the future`,
        options: []
    },
    {
        id: 27,
        content: `Blowing things out of proportion (catastrophizing) or inapprotiately shrinking something to make it seem less important`,
        options: []
    },
    {
        id: 28,
        content: `Assuming that because we feel a certain way what we think must be true
        I feel embrassed so I must be an idiot`,
        options: []
    },
    {
        id: 29,
        content: `Using critical worked like 'should,' 'must' and 'ought,' can make us feel guilty, or like we have already failed.
        If we apply 'should' to other people the result if ofen frustration`,
        options: []
    },
    {
        id: 30,
        content: `Assigning labels to ourselves or other people
        I'm a loser
        They are completely useless
        I'm a failure`,
        options: []
    },
    {
        id: 31,
        content: `Blaming yourself or taking responsibility for something that wasn't completely your fault
        Conversely, blaming other people for something that was your fault`,
        options: []
    }
];

export type Node = {
    content: string,
    options: {
        text: string;
        value: number
    }[],
}
export const getData = (index: number): {
    content: string,
    options: {
        text: string;
        value: number
    }[],
    examples?: Node[][]
} | undefined => {
    if (index < CBT.length) return CBT[index];
    return undefined;
}

export const getCBTLength = (): number => {
    return CBT.length;
}
// export const getCBT = (): {
//     cbt: { content: string; options: string[] }[];
//     index: number;
// } => {
//     const index = Math.floor(Math.random() * Object.keys(CBTS).length);
//     return {
//         cbt: CBTS[Object.keys(CBTS)[index]],
//         index,
//     };
// };

// export const getSpecificCBT = (
//     index: number,
// ): { content: string; options: string[] }[] => {
//     return CBTS[Object.keys(CBTS)[index]];
// };
