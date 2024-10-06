import {
    updateCorrectQuestionForQuiz,
    getQuizStatus,
    getQuiz,
} from './quiz-dal';
import Clients from '@eddii-backend/clients';

describe('updateCorrectQuestionForQuiz', () => {
    it('should update the correct question successfully', async () => {
        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockResolvedValue({
            Attributes: { correctQuestionIds: { values: ['1'] } },
        });

        const result = await updateCorrectQuestionForQuiz(
            'email',
            'quiz1',
            '1',
        );

        expect(result).toEqual({ correctQuestionIds: ['1'] });
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when an unexpected error occurs', async () => {
        const calledSpy = (
            Clients.dynamo.update({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Unexpected error'));

        await expect(
            updateCorrectQuestionForQuiz('email', 'quiz1', '1'),
        ).rejects.toThrow('Error updating quiz status.');
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});

describe('getQuizStatus', () => {
    it('should return the quiz status successfully', async () => {
        const expectedStatus = {
            quizId: 'quiz1',
            status: 'in_progress',
        };

        const calledSpy = (
            Clients.dynamo.get({} as any).promise as jest.Mock
        ).mockResolvedValue({ Item: expectedStatus });

        const result = await getQuizStatus('email', 'quiz1');

        expect(result).toEqual(expectedStatus);
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when an unexpected error occurs', async () => {
        const calledSpy = (
            Clients.dynamo.get({} as any).promise as jest.Mock
        ).mockRejectedValue(new Error('Unexpected error'));

        await expect(getQuizStatus('email', 'quiz1')).rejects.toThrow(
            'Error getting quiz status.',
        );
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});

describe('Quiz Questions', () => {
    ['quiz1', 'quiz2', 'quiz3', 'quiz4', 'quiz5'].forEach(quizId => {
        it(`${quizId} - should ensure all questions have unique IDs and correctAnswer exists in possibleAnswers`, async () => {
            const questions = getQuiz(quizId)?.questions;

            const ids = questions?.map(q => q.questionId);
            const isUnique = new Set(ids).size === ids?.length;
            expect(isUnique).toBe(true);

            questions?.forEach(
                (question: {
                    correctAnswers: (string | number)[];
                    possibleAnswers: (string | number)[];
                }) => {
                    const allCorrectAnswersExist =
                        question.correctAnswers.every(
                            (answer: string | number) =>
                                question.possibleAnswers.includes(answer),
                        );
                    expect(allCorrectAnswersExist).toBe(true);
                },
            );
        });
    });
});
