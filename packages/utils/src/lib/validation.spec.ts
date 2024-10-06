import {
    validSmallString,
    validMediumString,
    validTaskType,
    validStoreItemSlot,
    validFood,
    validFeeling,
    validMedicine,
    validExercise,
    validTimeZone,
} from './validation';

describe('Validation functions', () => {
    describe('validSmallString', () => {
        it('returns true for a string with length <= 50', () => {
            expect(validSmallString('a'.repeat(50))).toBe(true);
        });

        it('returns false for a string with length > 128', () => {
            expect(validSmallString('a'.repeat(129))).toBe(false);
        });
    });

    describe('validMediumString', () => {
        it('returns true for a string with length <= 1024', () => {
            expect(validMediumString('a'.repeat(500))).toBe(true);
        });

        it('returns false for a string with length > 1024', () => {
            expect(validMediumString('a'.repeat(1025))).toBe(false);
        });
    });

    describe('validTaskType', () => {
        it('returns true for a valid task type', () => {
            expect(validTaskType('dataEntry')).toBe(true);
        });

        it('returns false for an invalid task type', () => {
            expect(validTaskType('INVALID')).toBe(false);
        });
    });

    describe('validStoreItemSlot', () => {
        it('returns true for a valid store item slot', () => {
            expect(validStoreItemSlot('background')).toBe(true);
        });

        it('returns false for an invalid store item slot', () => {
            expect(validStoreItemSlot('INVALID')).toBe(false);
        });
    });

    describe('validFood', () => {
        it('returns true for a valid food object', () => {
            expect(
                validFood({
                    foodName: 'Apple',
                    macros: {
                        carbs: 10,
                    },
                }),
            ).toBe(true);
        });

        it('returns false for an invalid food object', () => {
            expect(validFood({})).toBe(false);
        });
    });

    describe('validFeeling', () => {
        it('returns true for a valid feeling object', () => {
            expect(
                validFeeling({
                    feeling: 'happy',
                }),
            ).toBe(true);
        });

        it('returns false for an invalid feeling type', () => {
            expect(
                validFeeling({
                    feeling: 'ksljfklsdjfklsl',
                }),
            ).toBe(false);
        });

        it('returns false for an invalid feeling object', () => {
            expect(validFeeling({})).toBe(false);
        });
    });

    describe('validMedicine', () => {
        it('returns true for a valid medicine object', () => {
            expect(
                validMedicine({
                    medicineType: 'PILL',
                    medicineName: 'Ibuprofen',
                    amount: 1,
                }),
            ).toBe(true);
        });

        it('returns false for an invalid medicine object', () => {
            expect(validMedicine({})).toBe(false);
        });
    });

    describe('validExercise', () => {
        it('returns true for a valid exercise object', () => {
            expect(
                validExercise({
                    exerciseTime: 30,
                }),
            ).toBe(true);
        });

        it('returns false for an invalid exercise object', () => {
            expect(validExercise({})).toBe(false);
        });
    });

    describe('validTimeZone', () => {
        it('returns true for a valid time zone', () => {
            expect(validTimeZone('America/New_York')).toBe(true);
            expect(validTimeZone('America/Indiana/Indianapolis')).toBe(true);
            expect(validTimeZone('Europe/London')).toBe(true);
            expect(validTimeZone('Asia/Tokyo')).toBe(true);
        });

        it('returns false for an invalid time zone', () => {
            expect(validTimeZone('Invalid/Timezone')).toBe(false);
            expect(validTimeZone('America/InvalidCity')).toBe(false);
        });

        it('returns false for undefined input', () => {
            expect(validTimeZone(undefined)).toBe(false);
        });

        it('returns false for empty string input', () => {
            expect(validTimeZone('')).toBe(false);
        });
    });
});
