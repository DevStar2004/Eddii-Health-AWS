import { STORIES } from './story';
import { JOKES } from './joke';
import { CBTS } from './cbt';
import { MEDITATIONS } from './meditation';
import { FEELINGS } from './feelings';

describe('Story content and options validation', () => {
    Object.entries(STORIES).forEach(([storyKey, storyArray]) => {
        describe(`${storyKey}`, () => {
            storyArray.forEach((story, index) => {
                test(`Story ${index + 1} content should be less than 250 characters`, () => {
                    expect(story.content.length).toBeLessThan(250);
                });

                test(`Story ${index + 1} should have 5 or fewer options`, () => {
                    expect(story.options.length).toBeLessThanOrEqual(5);
                });
            });
        });
    });
});

describe('Joke content and options validation', () => {
    Object.entries(JOKES).forEach(([index, jokeObject]) => {
        test(`Joke ${parseInt(index) + 1} content should be less than 250 characters`, () => {
            expect(jokeObject.joke.length).toBeLessThan(250);
        });

        test(`Punchline ${parseInt(index) + 1} should be less than 250 characters`, () => {
            expect(jokeObject.punchline.length).toBeLessThan(250);
        });
    });
});

describe('CBT content and options validation', () => {
    Object.entries(CBTS).forEach(([cbtKey, cbtArray]) => {
        describe(`${cbtKey}`, () => {
            cbtArray.forEach((cbt, index) => {
                test(`CBT ${index + 1} content should be less than 250 characters`, () => {
                    expect(cbt.content.length).toBeLessThan(250);
                });

                if (cbt.options) {
                    test(`CBT ${index + 1} should have 5 or fewer options`, () => {
                        expect(cbt.options.length).toBeLessThanOrEqual(5);
                    });
                }
            });
        });
    });
});

describe('Meditation content and options validation', () => {
    Object.entries(MEDITATIONS).forEach(([meditationKey, meditationArray]) => {
        describe(`${meditationKey}`, () => {
            meditationArray.forEach((meditation, index) => {
                test(`Meditation ${index + 1} content should be less than 250 characters`, () => {
                    expect(meditation.content.length).toBeLessThan(250);
                });

                test(`Meditation ${index + 1} should have 5 or fewer options`, () => {
                    expect(meditation.options.length).toBeLessThanOrEqual(5);
                });
            });
        });
    });
});

describe('Feelings content validation', () => {
    Object.entries(FEELINGS).forEach(([feelingKey, feelingArray]) => {
        describe(`${feelingKey}`, () => {
            feelingArray.forEach((feeling, index) => {
                test(`Feeling ${feelingKey} content ${index + 1} should be less than 250 characters`, () => {
                    expect(feeling.content.length).toBeLessThan(250);
                });
            });
        });
    });
});
