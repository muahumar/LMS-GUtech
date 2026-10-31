import { quizRepository } from '../repositories/quiz.repository.js';
import { courseService } from './course.service.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils/appError.js';
import { QuestionType } from '../repositories/types.js';

export class QuizService {
  async createQuiz(
    teacherId: string,
    role: string,
    courseId: string,
    input: {
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
    }
  ) {
    await courseService.verifyCourseAccess(courseId, teacherId, role);

    const quiz = await quizRepository.createQuiz({
      courseId,
      createdBy: teacherId,
      ...input,
    });

    await auditRepository.log('CREATE_QUIZ', 'quiz', quiz.id, teacherId);
    return quiz;
  }

  async updateQuiz(quizId: string, userId: string, role: string, updates: any) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw AppError.notFound('Quiz not found');
    }

    if (role !== 'admin') {
      await courseService.verifyCourseAccess(quiz.courseId, userId, role);
    }

    // Spec Acceptance Rule: Edit blocked once any attempt exists
    const attemptsCount = await quizRepository.countAttempts(quizId);
    if (attemptsCount > 0 && (updates.questions || updates.timeLimitMinutes)) {
      throw AppError.conflict('Cannot modify questions or time limit once student attempts have begun');
    }

    const updated = await quizRepository.updateQuiz(quizId, updates);
    await auditRepository.log('UPDATE_QUIZ', 'quiz', quizId, userId);
    return updated;
  }

  async listQuizzes(courseId: string, userId: string, role: string) {
    await courseService.verifyCourseAccess(courseId, userId, role);

    const quizzes = await quizRepository.listByCourse(courseId);

    // If student, filter only published and include attempt status
    if (role === 'student') {
      const published = quizzes.filter((q) => q.isPublished);
      const enriched = await Promise.all(
        published.map(async (q) => {
          const attempt = await quizRepository.getAttempt(q.id, userId);
          return {
            ...q,
            hasAttempted: Boolean(attempt && attempt.submittedAt),
            myAttempt: attempt,
          };
        })
      );
      return enriched;
    }

    return quizzes;
  }

  async getQuizDetails(quizId: string, userId: string, role: string) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw AppError.notFound('Quiz not found');
    }

    await courseService.verifyCourseAccess(quiz.courseId, userId, role);

    if (role === 'student') {
      if (!quiz.isPublished) {
        throw AppError.forbidden('Quiz is not yet published');
      }
      const questions = await quizRepository.getQuestionsForStudent(quizId);
      const attempt = await quizRepository.getAttempt(quizId, userId);
      return {
        ...quiz,
        questions,
        myAttempt: attempt,
      };
    }

    // Teacher/admin sees questions with answers
    const questionsWithAnswers = await quizRepository.getQuestionsWithAnswers(quizId);
    return {
      ...quiz,
      questions: questionsWithAnswers,
    };
  }

  async startAttempt(quizId: string, studentId: string) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw AppError.notFound('Quiz not found');
    }

    await courseService.verifyCourseAccess(quiz.courseId, studentId, 'student');

    if (!quiz.isPublished) {
      throw AppError.forbidden('Quiz is not published');
    }

    const now = new Date();
    if (now.getTime() < new Date(quiz.opensAt).getTime()) {
      throw AppError.forbidden('Quiz window is not open yet');
    }
    if (now.getTime() > new Date(quiz.closesAt).getTime()) {
      throw AppError.conflict('Quiz window has closed');
    }

    // Spec Acceptance Rule: A second attempt is rejected (409)
    const existing = await quizRepository.getAttempt(quizId, studentId);
    if (existing) {
      if (existing.submittedAt) {
        throw AppError.conflict('You have already submitted an attempt for this quiz');
      }
      // Resume existing in-progress attempt
      const questions = await quizRepository.getQuestionsForStudent(quizId);
      const expiresAt = new Date(new Date(existing.startedAt).getTime() + quiz.timeLimitMinutes * 60 * 1000).toISOString();
      return {
        attempt: existing,
        questions,
        expiresAt,
      };
    }

    const attempt = await quizRepository.startAttempt(quizId, studentId);
    // Spec Rule: returns questions WITHOUT answers, started_at, expires_at
    const questions = await quizRepository.getQuestionsForStudent(quizId);
    const expiresAt = new Date(new Date(attempt.startedAt).getTime() + quiz.timeLimitMinutes * 60 * 1000).toISOString();

    await auditRepository.log('START_QUIZ_ATTEMPT', 'quiz_attempt', attempt.id, studentId);

    return {
      attempt,
      questions,
      expiresAt,
    };
  }

  async submitAttempt(
    quizId: string,
    studentId: string,
    answers: Record<string, string[]>
  ) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw AppError.notFound('Quiz not found');
    }

    const attempt = await quizRepository.getAttempt(quizId, studentId);
    if (!attempt) {
      throw AppError.notFound('No active quiz attempt found');
    }

    if (attempt.submittedAt) {
      throw AppError.conflict('This quiz attempt has already been submitted');
    }

    // Spec Rule: reject submissions after started_at + time_limit plus 10 s grace
    const startedTime = new Date(attempt.startedAt).getTime();
    const timeLimitMs = (quiz.timeLimitMinutes * 60 + 10) * 1000; // 10s grace
    const currentTime = Date.now();

    if (currentTime > startedTime + timeLimitMs) {
      // Exceeded time limit plus grace period
      // Score as 0 or reject per spec
      await quizRepository.saveAttemptSubmission(attempt.id, answers, 0);
      throw AppError.conflict('Quiz time limit expired. Attempt auto-submitted.');
    }

    // Server-side auto-grading against quiz_answers
    const quizAnswers = await quizRepository.getAnswersForQuiz(quizId);
    let calculatedScore = 0;

    for (const [questionId, expected] of Object.entries(quizAnswers)) {
      const studentSelected = answers[questionId] || [];
      const correctOptions = expected.correctOptionIds;

      // Spec Rule: multi-select is all-or-nothing per question
      const isCorrect =
        studentSelected.length === correctOptions.length &&
        studentSelected.every((opt) => correctOptions.includes(opt));

      if (isCorrect) {
        calculatedScore += expected.marks;
      }
    }

    const gradedAttempt = await quizRepository.saveAttemptSubmission(
      attempt.id,
      answers,
      calculatedScore
    );

    await auditRepository.log('SUBMIT_QUIZ_ATTEMPT', 'quiz_attempt', attempt.id, studentId);

    return {
      message: 'Quiz submitted and auto-graded successfully',
      score: calculatedScore,
      totalMarks: quiz.totalMarks,
      attempt: gradedAttempt,
    };
  }

  async listResults(quizId: string, userId: string, role: string) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw AppError.notFound('Quiz not found');
    }

    if (role !== 'admin') {
      await courseService.verifyCourseAccess(quiz.courseId, userId, role);
    }

    return quizRepository.listResultsForQuiz(quizId);
  }
}

export const quizService = new QuizService();
