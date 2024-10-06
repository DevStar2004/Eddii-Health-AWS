const APP_ASSETS_DISTRIBUTION_URL = `https://${process.env['ASSETS_DISTRIBUTION_DOMAIN_NAME']}/chatbot`;

export const MEDITATIONS = {
    meditat1: [
        {
            content: 'Take a slow, deep breath through your nose! ',
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii_breath.gif`,
            options: ['Continue'],
        },
        {
            content: 'Do you feel your belly filling up with air?',
            options: ['I do', 'Not really..'],
        },
        {
            content: 'Hold your breath in for a few seconds',
            options: ['Continue'],
        },
        {
            content: 'Then, slowly blow the air out through your nose',
            options: ['Continue breathing', "I'm done"],
        },
        {
            content:
                'Great job! Mission accomplished. Do you feel a little bit better?',
            options: ['Better', 'Not really 😔'],
        },
        {
            content:
                'Did you know that feeling stressed can make your blood sugar spike?',
            options: ['I did', 'Not really'],
        },
    ],
    meditat2: [
        {
            content:
                'Sitting comfortably, take a deep breath through your nose',
            options: ['Continue'],
        },
        {
            content: 'Out through the mouth, eyes open',
            options: ['Continue'],
        },
        {
            content: 'Focus on flower',
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/flower.gif`,
            options: ['Continue'],
        },
        {
            content: 'Keep focus on the flower, opening and closing',
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/flower.gif`,
            options: ['Continue'],
        },
        {
            content: 'Now slowly zoom back out',
            options: ['Continue'],
        },
        {
            content: 'As you blink a few times, keep breathing',
            options: ['Continue focusing', "I'm done"],
        },
        {
            content:
                'Great job! Mission accomplished. Do you feel a little bit better?',
            options: ['Better', 'Not really 😔'],
        },
    ],
};

export const getMeditation = (): {
    meditation: { content: string; options: string[] }[];
    index: number;
} => {
    const index = Math.floor(Math.random() * Object.keys(MEDITATIONS).length);
    return {
        meditation: MEDITATIONS[Object.keys(MEDITATIONS)[index]],
        index,
    };
};

export const getSpecificMeditation = (
    index: number,
): { content: string; options: string[] }[] => {
    return MEDITATIONS[Object.keys(MEDITATIONS)[index]];
};
