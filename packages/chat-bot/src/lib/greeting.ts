const GREETINGS = [
    "test-Hello my friend. Hope you're having a good day so far 😊",
    'test-Hi there! Just loooove it when you get in touch 😊',
    "test-Hello my lovely friend, it's so nice of you to get in touch 😊",
    "test-How's everything? I was just thinking of you ❤️",
    "test-Good day! How's life? 😎",
    "test-What's new? Hope you are having a great day so far! 😊",
    'test-Howdy, buddy! 😊',
    'test-Whazzup? 😉',
    'test-Howdy-doody! 🤟🏼',
    'test-Hiya! 😉',
];


export const getGreeting = (): string => {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
};
