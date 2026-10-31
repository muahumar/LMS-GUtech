import { db } from './inMemoryStore.js';
import { Quiz, QuizQuestion, QuizAnswer, QuizAttempt, QuestionType } from './types.js';
import crypto from 'crypto';

export class QuizRepository {
  async findById(id: string): Promise<Quiz | null> {
    const q = db.quizzes.find((x) => x.id === id);
    if (!q) return null;
    const questions = db.quizQuestions.filter((qq) => qq.quizId === id);
    const totalMarks = questions.reduce((sum, item) => sum + item.marks, 0);
    return {
      ...q,
      totalMarks,
      questionCount: questions.length,
    };
  }

  async listByCourse(courseId: string): Promise<Quiz[]> {
    return db.quizzes
      .filter((q) => q.courseId === courseId)
      .map((q) => {
        const questions = db.quizQuestions.filter((qq) => qq.quizId === q.id);
        const totalMarks = questions.reduce((sum, item) => sum + item.marks, 0);
        return {
          ...q,
          totalMarks,
          questionCount: questions.length,
        };
      });
  }

  async createQuiz(input: {
    courseId: string;
    createdBy: string;
    title: string;
    description?: string;
    timeLimitMinutes: number;
    opensAt: string;
    closesAt: string;
    questions: Array<{
      prompt: string;
      type: QuestionType;
      marks: number;
      options: Array<{ id: string; text: string }>;
      correctOptionIds: string[];
    }>;
  }): Promise<Quiz> {
    const quizId = crypto.randomUUID();
    let totalMarks = 0;

    input.questions.forEach((q, index) => {
      const questionId = crypto.randomUUID();
      const question: QuizQuestion = {
        id: questionId,
        quizId,
        position: index + 1,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        marks: q.marks,
      };
      db.quizQuestions.push(question);

      const answer: QuizAnswer = {
        questionId,
        correctOptionIds: q.correctOptionIds,
      };
      db.quizAnswers.push(answer);
      totalMarks += q.marks;
    });

    const newQuiz: Quiz = {
      id: quizId,
      courseId: input.courseId,
      createdBy: input.createdBy,
      title: input.title,
      description: input.description || null,
      timeLimitMinutes: input.timeLimitMinutes,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      isPublished: false,
      createdAt: new Date().toISOString(),
      totalMarks,
      questionCount: input.questions.length,
    };

    db.quizzes.push(newQuiz);
    return { ...newQuiz };
  }

  async updateQuiz(
    id: string,
    updates: Partial<{
      title: string;
      description?: string;
      timeLimitMinutes: number;
      opensAt: string;
      closesAt: string;
      isPublished: boolean;
    }>
  ): Promise<Quiz | null> {
    const q = db.quizzes.find((x) => x.id === id);
    if (!q) return null;

    if (updates.title !== undefined) q.title = updates.title;
    if (updates.description !== undefined) q.description = updates.description;
    if (updates.timeLimitMinutes !== undefined) q.timeLimitMinutes = updates.timeLimitMinutes;
    if (updates.opensAt !== undefined) q.opensAt = updates.opensAt;
    if (updates.closesAt !== undefined) q.closesAt = updates.closesAt;
    if (updates.isPublished !== undefined) q.isPublished = updates.isPublished;

    return this.findById(id);
  }

  async countAttempts(quizId: string): Promise<number> {
    return db.quizAttempts.filter((a) => a.quizId === quizId).length;
  }

  async getQuestionsForStudent(quizId: string): Promise<Omit<QuizQuestion, 'correctOptionIds'>[]> {
    // CRITICAL: NEVER include quiz_answers in student query
    return db.quizQuestions
      .filter((q) => q.quizId === quizId)
      .sort((a, b) => a.position - b.position)
      .map((q) => ({
        id: q.id,
        quizId: q.quizId,
        position: q.position,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        marks: q.marks,
      }));
  }

  async getQuestionsWithAnswers(
    quizId: string
  ): Promise<Array<QuizQuestion & { correctOptionIds: string[] }>> {
    const questions = db.quizQuestions.filter((q) => q.quizId === quizId);
    return questions.map((q) => {
      const ans = db.quizAnswers.find((a) => a.questionId === q.id);
      return {
        ...q,
        correctOptionIds: ans ? ans.correctOptionIds : [],
      };
    });
  }

  async getAnswersForQuiz(quizId: string): Promise<Record<string, { correctOptionIds: string[]; marks: number; type: QuestionType }>> {
    const questions = db.quizQuestions.filter((q) => q.quizId === quizId);
    const result: Record<string, { correctOptionIds: string[]; marks: number; type: QuestionType }> = {};

    for (const q of questions) {
      const ans = db.quizAnswers.find((a) => a.questionId === q.id);
      if (ans) {
        result[q.id] = {
          correctOptionIds: ans.correctOptionIds,
          marks: q.marks,
          type: q.type,
        };
      }
    }
    return result;
  }

  async getAttempt(quizId: string, studentId: string): Promise<QuizAttempt | null> {
    const a = db.quizAttempts.find(
      (x) => x.quizId === quizId && x.studentId === studentId
    );
    if (!a) return null;
    const student = db.profiles.find((p) => p.id === a.studentId);
    return {
      ...a,
      studentName: student?.fullName,
    };
  }

  async startAttempt(quizId: string, studentId: string): Promise<QuizAttempt> {
    const id = crypto.randomUUID();
    const student = db.profiles.find((p) => p.id === studentId);
    const newAttempt: QuizAttempt = {
      id,
      quizId,
      studentId,
      startedAt: new Date().toISOString(),
      submittedAt: null,
      answers: {},
      score: null,
      studentName: student?.fullName,
    };
    db.quizAttempts.push(newAttempt);
    return { ...newAttempt };
  }

  async saveAttemptSubmission(
    attemptId: string,
    answers: Record<string, string[]>,
    score: number
  ): Promise<QuizAttempt | null> {
    const attempt = db.quizAttempts.find((a) => a.id === attemptId);
    if (!attempt) return null;

    attempt.answers = answers;
    attempt.score = score;
    attempt.submittedAt = new Date().toISOString();

    const student = db.profiles.find((p) => p.id === attempt.studentId);
    return {
      ...attempt,
      studentName: student?.fullName,
    };
  }

  async listResultsForQuiz(quizId: string): Promise<QuizAttempt[]> {
    return db.quizAttempts
      .filter((a) => a.quizId === quizId)
      .map((a) => {
        const student = db.profiles.find((p) => p.id === a.studentId);
        return {
          ...a,
          studentName: student?.fullName || 'Student',
        };
      });
  }
}

export const quizRepository = new QuizRepository();
