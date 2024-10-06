export enum QuestionType {
    // eslint-disable-next-line no-unused-vars
    IMAGE = 'image',
    // eslint-disable-next-line no-unused-vars
    TEXT = 'text',
}

export interface Question {
    questionId: string;
    question: string;
    type: QuestionType;
    possibleAnswers: string[] | number[];
    correctAnswers: string[] | number[];
}

export interface Quiz {
    quizId: string;
    questions: Question[];
}

export interface QuizStatus {
    email: string;
    quizId: string;
    correctQuestionIds: string[];
}
