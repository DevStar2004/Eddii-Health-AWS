import { PublishCommand } from '@aws-sdk/client-sns';
import Clients from '@eddii-backend/clients';
import { SendVoiceMessageCommand } from '@aws-sdk/client-pinpoint-sms-voice-v2';

export const publishPushNotificationToUserTopicArn = async (
    userTopicArn: string,
    title: string,
    message: string,
    collapseKey: string,
) => {
    if (!userTopicArn) {
        console.warn('No userTopicArn provided, skipping push notification.');
        return;
    }
    const snsClient = Clients.sns;
    console.log(`Publishing push ${message} to ${userTopicArn}`);
    try {
        await snsClient.send(
            new PublishCommand({
                Message: JSON.stringify({
                    default: message,
                    GCM: JSON.stringify({
                        notification: {
                            title: title,
                            body: message,
                        },
                        data: {
                            collapse_key: collapseKey,
                        },
                    }),
                    APNS: JSON.stringify({
                        aps: {
                            alert: {
                                title: title,
                                body: message,
                            },
                            'apns-collapse-id': collapseKey,
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
                TopicArn: userTopicArn,
            }),
        );
    } catch (error) {
        console.error(
            `Error publishing push ${message} to ${userTopicArn}: `,
            error,
        );
        throw new Error('Error publishing push notifcation.');
    }
};

export const getGlucoseNotification = (
    alertName: string,
): string | undefined => {
    let bodies: string[] = [];
    if (alertName === 'high') {
        bodies = [
            "Uh-oh! It looks like your glucose levels are flying high like a kite. Let's reel the kite in! 📈",
            'Has your insulin been playing hide and seek? 👀',
            "eddii's burning up, tap the app to make a plan of action 🥵",
            "Hot potato alert! eddii's sweatin' it out, time to cool things down! 🥵",
            "I'm getting hot and sweaty! You know what that means... 🥵",
            "Who turned up the thermostat, it's getting hot in here! 🥵",
            "I'm sizzlin' in here! your glucose is having a BBQ party! 🥵🔥",
            'Time to cool eddii down! 😇',
            "Whoa, it's getting toasty in here. I'm roasting up! 🍃👉🍂",
            "eddii's sweating it out, and it's not because of a workout! 🥵",
            'You there? There are some flames to put out in here! 🔥',
            "It's getting tropical in here. Time to cool this heatwave down 🥵",
            "I'm sweatin' like a popsicle on a summer day! Your sugar's misbehaving 🥵",
            "I'd love to go dancing in the rain right now... 🌧️",
            "Sugar's having a bonfire - let's rain on its parade! 🔥🌧️",
            "I'm hotter than a jalapeño on a summer day! 🥵",
            "Someone's turning up the heat with their sugar levels! 🥵",
            "Hey, Buddy! It's a sauna in here! 🥵",
            "Sugar's soaring like the cow jumping the moon, eddii's here to bring it down soon! 🤝",
            "Sugar's high and eddii's hot! 🥵 Let's cool him down, just like a breeze to put your sugar at ease 😇",
            "eddii's in a tizzy, check-in and see. Your sugar's soaring like a bumblebee! 😰",
            "Sugar's throwing a wild party and eddii's not invited! 🥺",
            "Sugar's soaring like a rocket ship! eddii's got the extinguisher, but we need your help to bring it down! 🧯🔥",
            ///// Christmas /////
            //'Ho, ho, hold up! Your blood sugar is heading to the north pole 🎅',
            //"🎶 Baby, it's cold outside 🎶 but your blood sugar is heating up!",
            //"Your sugar's flying as high as Rudolph right now 🦌",
            //"🍭 Sugar levels are soaring higher than Santa's sleigh. Let eddii be your blood sugar navigator and guide you back to a sweet spot 🎅",
            //'🎅 Your blood sugar is on the naughty list - time to bring it back to the nice list with some eddii cheer! 🌲🌟',
        ];
    } else if (alertName === 'urgentLow') {
        bodies = [
            '⚠️ Urgent! Very low blood sugar. Tell someone now. Safety first.',
            '⚠️ Critical alert: Low blood sugar ',
            "⚠️ eddii emergency: Act now. You're very low.",
            '⚠️ Immediate action required. Very low blood sugar. Notify someone!',
            'Danger! Low blood sugar ⚠️',
            'Serious alert: Urgent low now ⚠️',
            '⚠️ We have an urgent situation here: Low blood sugar. Alert someone.',
            '⚠️ Important! Low blood sugar. Please stop whatever you are doing to sort it ',
            "⚠️ Swift action needed. You're very low. Notify someone now.",
            '⚠️ Critical low alert.',
            '⚠️ Grab sugar fast! Low blood sugar alert. ',
            "⚠️ It's sugar time! Low blood sugar alert. Snack attack, quick!",
            "⚠️ Don't wait! Low blood sugar - get sugar NOW for a rapid boost!",
            '⚠️ Sugar rescue mission! Low blood sugar calls for a sugary snack. Go for it!',
            '⚠️ How about you DRINK something sweet 🧃 so I can warm up?',
            'How about you BITE into something sweet so I can warm up? 🍬',
            "When your blood sugar is urgent low, it's called hypoglycaemia. I like to call it a hypo-no no 😯",
            "Best friends like us share a connection, so I know you're not feeling great right now. Some sugar will help! 🧃",
        ];
    } else if (alertName === 'urgentLowSoon') {
        bodies = [
            "It's arctic in here! You're getting very low! 🥶",
            "Brrr! You'll be very low soon! 😥",
            "I'm freezing over here... Time for a snack attack! ⏰🍪",
            "Time to warm me up, pronto. We're gonna be super low soon! ⏳🥶",
            "To the kitchen, don't be slow, grab a snack and watch that glucose grow! 🍬🏃",
            "Buddy, eddii's in 'emergency mode.' Grab a snack, quick! We'll fix this low together 👊",
            "Urgent alert, buddy! Your blood sugar is dropping fast. Let's fix this together. Grab a snack or juice right now! 🧃",
            "It's time for action! Your blood sugar is heading south quickly 😰",
            'Emergency mode, champ! Your blood sugar is dropping rapidly. Grab a snack or juice ASAP to feel your best! 🧃🍬',
            "Your blood sugar is dropping quickly. Time to refuel with a snack, and you'll be back in action! 🤝",
            'Urgent message from eddii! Your blood sugar is falling fast. 📉',
            "Breaking news from eddii HQ: Your blood sugar's falling fast. It's sugar-o-clock! 🍬⏰",
            'Sugar rush needed! Low blood sugar - reach for that sweet treat! 🍬',
            'Speedy sugar needed! Low blood sugar alert. Grab a sweet treat, stat! 🍬',
            "I'm feeling light-headed... 😵‍💫 Get me some sugar, please! 🧃",
            'Incoming! Urgent message for bestie: Raise your blood sugar! ⬆️',
            "Woooahhhh, the lower your sugar falls, the wilder my weather becomes! I'll soon be a tornado in here 🌪️",
        ];
    } else if (alertName === 'low') {
        bodies = [
            "Uh-oh, buddy! 😯 eddii's waving a blue flag here. Time for a snack rescue, pronto!",
            "Oh no, your sugar's feeling a bit shy. Let's coax it out with some delicious juice 🧃 or cookies 🍪",
            "Brrr! I'm turning into a snowflake ❄️ Time for a snack?",
            "I'm getting frosty in here - sugar's too low! 🥶",
            'Whoopsie-doodle! Your glucose levels are low 🫣',
            "Feelin' low? Have about a snack attack? 🍭🍬",
            'Got time to defrost eddii? 🥶',
            "Sorry for acting a little frosty, that's just because... I'm frozen!! 🥶",
            'Are we entering the next ice age? 🧊👀',
            "I'm shaking like a leaf in a snowstorm! 😶‍🌫️",
            "I'm not auditioning for the next Frozen movie! Warm me up, please? 🫣",
            "It's colder than a polar bear's picnic in here! 🥶",
            "eddii's got goosebumps. It's cold in here! 🥶",
            "I'm colder than a penguin's pajamas! 🐧",
            "I'm icier than... an iceberg! 🧊",
            "I'm freezing faster than frozen yogurt! Rescue mission: Snack time! 🧃🍬",
            "I haven't been this cold since I fell into that frozen pond! 🥶",
            'Come and see my impression of an icicle... 🥶',
            "Frostbite isn't too bad... if you like your toes falling off 😱",
            'Anyone got any flint? I need to start a campfire 🔥',
            "Oh, look... I've got icicles between my toes 😰",
            "Sugar's sleeping like Humpty Dumpty on the wall, but I'm here to prevent a fall! 🫠",
            "Your sugar's low, to the kitchen we go, grab a snack, and watch it grow! 📈",
            'Low sugar alert! Snack time, stat! 🍬🧃',
            "eddii's weather report: Cold, stormy skies ahead. You grab a snack, and I'll grab an umbrella! ☂️",
            '🚨 Emergency sugar mode: ON! Low blood sugar - find a sugar solution 🧃',
            'Sugar sprint! Low blood sugar alert. Quick, a sugary snack will save the day! 🥰',
            'Sweet salvation time! Low blood sugar - go for that sugar fix ASAP! 🧃',
            ///// Christmas /////
            //"It's colder than a surprise party thrown by a friendly yeti! 🥶",
            //"eddii's icier than a sassy snowman's sense of humor! ☃️",
            //'I could win a snowman contest right now 🌨️🍃',
            //"Brrrr! eddii's in a snow globe. Let's shake those sugar levels up! 🌨️",
            //"I'm frostier than a snow cone right now! 🍦❄️",
            //"eddii's icier than a snow cone at the North Pole! 🍦",
            //"It's colder than the North Pole in here! 🧊🐧",
            //"I'm turning into a snowman! Warm me up with some sugar 🎅",
        ];
    } else if (alertName === 'rise') {
        bodies = [
            "Hey, it's me! Your glucose levels are soaring like an eagle. Let's team up to fix them 📈",
            'Your sugar levels are about to blast off. Time to bring them back down to earth! 🌎',
            "eddii's getting hot and sweaty fast! Your glucose is quickly rising! 🥵",
            "eddii's burning up. Your glucose levels are shooting up! 📈🥵",
            "Your sugar levels are going on a spicy adventure 🌶️ It's getting hot, fast!",
            "Oh no no, the sugar volcano is about to erupt... 🌋 It's getting hotter by the minute!",
            "eddii's firing up like a rocket! 🚀 Sugar's rising fast!",
            "Is your sugar hosting a hot air balloon festival? 🔥 🎈It's rising fast!",
            "I never thought I'd miss my time as an ice cube... 🧊🫠🥵",
            "Someone's glucose is throwing a fiery fiesta in here... 🔥 🎉",
            "Ooft, where's my fan? I need to cool off, glucose is rising fast! 🪭 💨",
            "Sugar's climbing high, eddii's sweating, oh my, oh my! 📈 🥵",
        ];
    } else if (alertName === 'fall') {
        bodies = [
            'Your glucose levels are dropping like autumn leaves. Time for a quick snack break! 🍂🍌',
            "eddii's rapidly turning into an ice sculpture! 🥶",
            "eddii's getting chilly! Your glucose is falling fast! 📉",
            'My toes are freezing! Your glucose levels are dropping fast! 😯',
            "Activate my emergency parachute with a healthy snack! I'm falling fast 🍃",
            /// Christmas ///
            //'❄️ Snowflakes are falling, but so are your blood sugar levels!',
        ];
    } else if (alertName === 'noReadings') {
        bodies = [
            'Signal levels playing hide and seek right now 🤷 Check your CGM app for glucose levels and come back soon!',
            'Hello? Bestie? BESTIEEEE? 🤔',
            "It'll be a re-leaf when we're reunited 🤞",
            'I miss you, Bestie! 🥺',
            "You might have forgotten about me, but I'm going to stick to you like glue-cose. 😏 HA! I love a good diabetes joke 😂",
            'I miss the good times. Ahhh yes, all the games we used to play 🫶',
            "While you're gone, I'll be thinking of all the fun we've had together 🤩",
            "I hope you're back soon so we can play another game 😍",
        ];
    }
    if (bodies.length === 0) {
        return undefined;
    }
    const bodyInx = Math.floor(Math.random() * bodies.length);
    return bodies[bodyInx];
};

export const getDailyNotifications = (): {
    morning: { title: string; message: string; time: string };
    afternoon: { title: string; message: string; time: string };
    evening: { title: string; message: string; time: string };
    reminder: { title: string; message: string };
} => {
    const morningNotifications = [
        'Morning Bestie ☀️ I had a scary dream last night! 😨 You forgot to log your food today...',
        'Morning, Bestie! Rise and shine like the star you are 🌟',
        "Rise and shine! ☀️ But don't let your sugar rise too much... 👆🍭",
        "Morning Bestie! 🌤️ I'm back to help you. 😏 I bet that's a re-leaf...",
        "New day, same awesome you! 😎 Let's get it… 👊",
        "Good morning! ☀️ Ready to show diabetes who's boss? 💪",
        "Each new day, there's a new way to be awesome 💯 Let's go!",
        'Good morning! Ready to make some memories, Bestie? 💭',
        "Wakey wakey 👋 Don't forget to log your breaky! 🥣📊",
        "Morning! Wow, that's a big yawn. 🥱 I bet there's room in there for a healthy breakfast 🍎",
        'Start the day in the best way... being you! 🫵',
        'Morning, Bestie! Rise and shine like the star you are 🫵🌟',
        'With a new day, comes new things to learn 💡 (and new snacks!) 🥐',
        'Good morning! I hope you have an awesome day! 🫵💯',
        "Playing eddii's games is more fun than brushing your teeth 🪥😬 (but don't forget to do that too!)",
        "eddii's fun: Like a theme park in your pocket. 🎢 Ready for today's ride?",
        'Today, fun gets an upgrade 😝 Come on in...',
    ];
    const afternoonNotifications = [
        "eddii's a tap away! Come in and play? ☝️🌟",
        "You'll always have at least one heart...mine 💚",
        'Checking in on your leaf buddy is easier than homework... just stating facts 🍃👀📝',
        "Things I'm scared of: Rakes. Hungry caterpillars 🐛 My best buddy forgetting me! 😱",
        "Hey buddy, fancy hanging out? Hey, don't leaf me on 'read'! 👀",
        "Just saw a 3-year-old put a whole flower in her mouth. 🌸 😶 Hope you're having a better day than the flower! 😟",
        'Today might be a hard day, but remember, grumpy caterpillars could be beautiful friendly butterflies tomorrow! 😠🐛🦋',
        'It feels like forveverrr since we last spoke... 🥱 Wait, are you playing with another leaf!? 🤯🍁',
        "I'm here 'round the clock, just a tap away! 🕰️",
        'Hanging out with eddii beats cleaning your room any day! 🧹 Come say hi... 👋',
        "Let's level up together ⏫ Have you unlocked all my games? 👾",
        'Unlike veggies, a date with this green leaf is always a treat! 🍃💚',
        'eddii: 1 ☝️ Boredom: 0 👌 Pop in for some entertainment? 🕹️',
        'Are we playing hide and seek, or have you forgotten about me? 🤨',
        'Dive into my world. Come make a splash! 💦',
        ///// Christmas /////
        //'🍬Candy canes are sweet, but not as sweet as you!',
        //"🎅🔔 Jingle bells, blood sugars swell... Not on eddii's watch! 🍃",
        //'Consider me your leafy health elf this holiday! 🍃🎅',
    ];
    const eveningNotifications = [
        'Awesome job today! Remember to come and say goodnight 🌙👋',
        'I got some sweet sunshine. You earned some hearts. What a day!🫸💥🫷',
        'Bedtime is a time for looking back on the day and thinking WHAT A TEAM WE MAKE! 🍃🫵',
        "I'm a sleepy leafy 🍃 💤 We had so much fun today that I'm all tuckered out 😴",
        "Sleep's great. It can turn hungry caterpillars into friendly butterflies! 🐛💤🦋",
        "I'm a sleepy leafy. We had so much fun today that I'm all tuckered out 🍃💤",
        'You know what they say: "Good night sleep, happy leaf!" 🍃😊',
        'Sweet dreams! (But not too sweet!) 😏 HA! 😂',
        "🌙 Bedtime is a time for looking back on the day and realizing we showed diabetes who's boss! 😎",
        " As the stars twinkle in the night sky, eddii's here to add a little sparkle to your evening ✨",
        "In the quiet of the night, eddii's humor shines bright 💫 Tap to say hi... 👋",
        "Incredible work today! Don't forget to drop by for a goodnight game! 🌙🎮",
        "We've had a blast today and now it's time to recharge... 🪫🔋 Don't forget to charge your phone so we can hang out tomorrow! 🤝",
        "Day's done, team eddii won! 🍃 🥳 See you in dreamland! 🌙",
    ];
    const reminderNotifications = [
        "Hey there, sugar plum! 🍬 Miss you loads. Let's catch up and keep that streak going! 🎮🔥",
        "Knock knock! Who's there? It's your favorite leaf, missing you! Don't let that streak slip away! 🍃😢",
        "eddii's feeling a bit lonely... Time for a quick visit? Keep that awesome streak alive! 🥺👉👈",
        "Your glucose might be steady, but my heart's racing to see you again! Don't break our streak! ❤️🔥",
        "Remember me? I'm that cute leaf who helps you manage diabetes! 🍃 Let's hang out and keep your streak strong!",
        "eddii alert! 🚨 Your daily dose of fun is waiting. Don't miss out and lose your streak! 😎",
        "Hey bestie, I've got new jokes and games! Wanna hear them and keep that streak blazing? 🤡🎭🔥",
        'Pssst! Your pocket garden misses your green thumb. Time to water me with attention and nurture that streak! 🌱💦',
        "eddii's world is a bit gloomy without you. Bring back the sunshine and keep your streak shining! ☀️😊",
        'Uh-oh, my fun meter is running low. Only you can recharge it and keep our streak going strong! 🔋😉',
    ];
    const morningInx = Math.floor(Math.random() * morningNotifications.length);
    const afternoonInx = Math.floor(
        Math.random() * afternoonNotifications.length,
    );
    const eveningInx = Math.floor(Math.random() * eveningNotifications.length);
    const morningTime = 'T06:30:00';
    const afternoonHour = Math.floor(Math.random() * 4) + 12;
    const afternoonTime = `T${afternoonHour}:00:00`;
    const eveningTime = 'T20:00:00';
    const reminderInx = Math.floor(
        Math.random() * reminderNotifications.length,
    );

    return {
        morning: {
            title: 'Good Morning!',
            message: morningNotifications[morningInx],
            time: morningTime,
        },
        afternoon: {
            title: 'Afternoon Check-in',
            message: afternoonNotifications[afternoonInx],
            time: afternoonTime,
        },
        evening: {
            title: 'Evening Wrap-up',
            message: eveningNotifications[eveningInx],
            time: eveningTime,
        },
        reminder: {
            title: 'eddii Misses You! 🍃👋',
            message: reminderNotifications[reminderInx],
        },
    };
};

export const sendLowAlertVoiceMessage = async (
    phoneNumber: string,
    isGuardian = false,
) => {
    const pinpointSMSVoiceV2Client = Clients.pinpoint;
    try {
        const originationIdentity = process.env['PINPOINT_ORIGINATION_NUMBER'];
        if (!originationIdentity) {
            console.log('No PINPOINT_ORIGINATION_NUMBER set, skipping call.');
        } else {
            const data = await pinpointSMSVoiceV2Client.send(
                new SendVoiceMessageCommand({
                    DestinationPhoneNumber: phoneNumber,
                    OriginationIdentity: originationIdentity,
                    MessageBody: `<speak>Urgent eddi alert <break time="1s"/> Your ${isGuardian ? `child's ` : ' '}glucose levels are low. They may need your urgent attention. <break time="3s"/> Urgent eddi alert <break time="1s"/> Your ${isGuardian ? `child's ` : ' '}glucose levels are low. They may need your urgent attention.</speak>`,
                    MessageBodyTextType: 'SSML',
                    VoiceId: 'MATTHEW',
                    ConfigurationSetName: 'AlertPhoneCalls',
                    TimeToLive: 1800,
                }),
            );
            console.log('Voice message sent, response:', data);
        }
    } catch (error: any) {
        console.error(`Error sending voice message to ${phoneNumber}: `, error);
        if (error?.name === 'ServiceQuotaExceededException') {
            return;
        }
        throw new Error('Error sending voice message.');
    }
};

export const sendHighAlertVoiceMessage = async (
    phoneNumber: string,
    isGuardian = false,
) => {
    const pinpointSMSVoiceV2Client = Clients.pinpoint;
    try {
        const originationIdentity = process.env['PINPOINT_ORIGINATION_NUMBER'];
        if (!originationIdentity) {
            console.log('No PINPOINT_ORIGINATION_NUMBER set, skipping call.');
        } else {
            const data = await pinpointSMSVoiceV2Client.send(
                new SendVoiceMessageCommand({
                    DestinationPhoneNumber: phoneNumber,
                    OriginationIdentity: originationIdentity,
                    MessageBody: `<speak>Urgent eddi alert <break time="1s"/> Your ${isGuardian ? `child's ` : ' '}glucose levels are high. They may need your urgent attention. <break time="3s"/> Urgent eddi alert <break time="1s"/> Your ${isGuardian ? `child's ` : ' '}glucose levels are high. They may need your urgent attention.</speak>`,
                    MessageBodyTextType: 'SSML',
                    VoiceId: 'MATTHEW',
                    ConfigurationSetName: 'AlertPhoneCalls',
                    TimeToLive: 1800,
                }),
            );
            console.log('Voice message sent, response:', data);
        }
    } catch (error: any) {
        console.error(`Error sending voice message to ${phoneNumber}: `, error);
        if (error?.name === 'ServiceQuotaExceededException') {
            return;
        }
        throw new Error('Error sending voice message.');
    }
};
