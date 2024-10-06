export const JOKES = [
    {
        joke: 'What did one tree say to the tree that was a bully?',
        punchline: 'Leaf me alone',
    },
    {
        joke: 'What did the tree do when the bank closed?',
        punchline: 'It started its own branch.',
    },
    {
        joke: 'What do you call a tree that doubts autumn?',
        punchline: 'Dis-beleaf',
    },
    {
        joke: 'What did one autumn leaf say to another?',
        punchline: "I'm falling for you",
    },
    {
        joke: 'What is the cutest season?',
        punchline: 'Awwwwtumn',
    },
    {
        joke: 'What looks like half a leaf?',
        punchline: 'The other half',
    },
    {
        joke: "What do you call a military tree who doesn't return on time?",
        punchline: 'Absent without leaf.',
    },
    {
        joke: 'How do trees get online?',
        punchline: 'They just log in.',
    },
    {
        joke: 'How do you properly identify a dogwood tree?',
        punchline: 'By its bark!',
    },
    {
        joke: 'What type of tree fits in your hand?',
        punchline: 'A palm tree.',
    },
    {
        joke: "What's a tree's favorite dating app?",
        punchline: 'Timber.',
    },
    {
        joke: 'Why did the tree need to take a nap?',
        punchline: 'For-rest.',
    },
    {
        joke: 'Why was the weeping willow so sad?',
        punchline: 'It watched a sappy movie',
    },
    {
        joke: 'Why do you never want to invite a tree to your party?',
        punchline: 'Because they never leaf when you want them to.',
    },
    {
        joke: "Why couldn't the evergreen ever land a date?",
        punchline:
            'It was so busy pining after unavailable trees that it never really branched out.',
    },
    {
        joke: 'Why was the tree stumped?',
        punchline: "It couldn't get to the root of the problem.",
    },
    {
        joke: 'Where do saplings go to learn?',
        punchline: 'Elementree school.',
    },
    {
        joke: "Why couldn't the fig tree get back in shape?",
        punchline: "It couldn't stick to a root-ine.",
    },
    {
        joke: "What's the best way to make a tree laugh?",
        punchline: 'Tell it acorn-y joke.',
    },
    {
        joke: 'How did the tree get lost?',
        punchline: 'It took the wrong root.',
    },
    {
        joke: "How did the elm tree know the fig tree wasn't looking for anything serious?",
        punchline: 'It asked for no twigs attached.',
    },
    {
        joke: "Who is a pine tree's favorite singer?",
        punchline: 'Spruce Springsteen.',
    },
    {
        joke: 'Why do trees make the worst frenemies?',
        punchline: 'Because they are the best at throwing shade!',
    },
    {
        joke: 'Why did the pine tree get in trouble?',
        punchline: 'Because it was being knotty.',
    },
    {
        joke: "What did the trees wear to Mother Nature's pool party?",
        punchline: 'Swimming trunks!',
    },
    {
        joke: 'Which side of a tree has the most leaves?',
        punchline: 'The outside.',
    },
    {
        joke: 'How do bees travel to trees?',
        punchline: 'They take the buzz.',
    },
    {
        joke: 'What must trees drink responsibly?',
        punchline: 'Root beer.',
    },
    {
        joke: 'What kind of trees do you get when you plant kisses?',
        punchline: 'Tulips',
    },
    {
        joke: "Why can't Christmas trees sew?",
        punchline: 'They always drop their needles.',
    },
    {
        joke: 'What tree produces fruit that tastes like chicken?',
        punchline: 'Poul-tree.',
    },
    {
        joke: 'Why are leaves always involved in risky business?',
        punchline: 'Because they constantly have to go out on a limb.',
    },
    {
        joke: 'Would you like to read a joke about tree-free paper?',
        punchline: "The thing is, it's tearable.",
    },
    {
        joke: 'What did the rock say when it rolled into the tree?',
        punchline: "Nothing. Rocks don't talk!",
    },
    {
        joke: 'What do you call nice trees without any teeth?',
        punchline: 'Sweetgums.',
    },
    {
        joke: 'How many oranges grow on a tree?',
        punchline: 'All of them.',
    },
    {
        joke: 'What do you give to a sick citrus tree?',
        punchline: 'Lemon aid.',
    },
    {
        joke: 'What happened to the wooden car with wooden wheels and a wooden engine?',
        punchline: 'It wooden go.',
    },
    {
        joke: "What's the same size and shape as a giant sequoia tree, yet weighs nothing?",
        punchline: "A giant sequoia tree's shadow.",
    },
    {
        joke: 'Where do birch trees keep their valuables?',
        punchline: 'In a river bank',
    },
    {
        joke: 'Which Canadian city is a favorite vacation spot for American trees?',
        punchline: 'Mon-tree-al.',
    },
    {
        joke: 'What did the Jedi say to the sacred tree?',
        punchline: 'May the forest be with you.',
    },
    {
        joke: 'What kind of stories do giant sequoia trees tell?',
        punchline: 'Tall tales.',
    },
    {
        joke: "What is every tree's favorite shape?",
        punchline: 'A treeangle.',
    },
    {
        joke: 'What football player do leaves root for?',
        punchline: 'Rustle Wilson',
    },
    {
        joke: "Why did the banana tree make a doctor's appointment during a terrible storm?",
        punchline: 'Because her fruit was peeling under the weather.',
    },
    {
        joke: 'Which former president is the favorite of most trees?',
        punchline: 'Woodrow Wilson.',
    },
    {
        joke: 'How do trees access the internet?',
        punchline: 'They log in, of course!',
    },
    {
        joke: 'What did the tree say to the lumberjack?',
        punchline: "I'm falling for you",
    },
];

export const getJoke = (): { joke: string; index: number } => {
    const index = Math.floor(Math.random() * JOKES.length);
    return {
        joke: JOKES[index].joke,
        index,
    };
};

export const getPunchline = (index: number): string => {
    return JOKES[index].punchline;
};
