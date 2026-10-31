import { db } from './inMemoryStore.js';
import { StudentMark } from './types.js';

export interface StudentMarksSummary {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  items: Array<{
    itemId: string;
    kind: 'assignment' | 'quiz';
    title: string;
    obtained: number | null;
    max: number;
    status: 'Graded' | 'Pending' | 'Not Submitted';
    gradedAt: string | null;
  }>;
  totalObtained: number;
  totalMax: number;
  percentage: number | null;
}

export interface GradebookMatrix {
  courseId: string;
  items: Array<{
    id: string;
    title: string;
    kind: 'assignment' | 'quiz';
    maxMarks: number;
  }>;
  students: Array<{
    id: string;
    fullName: string;
    rollNo: string | null;
    marks: Record<string, { obtained: number | null; status: 'Graded' | 'Pending' | 'Not Submitted' }>;
    totalObtained: number;
    totalMax: number;
    percentage: number | null;
  }>;
}

export class MarksRepository {
  async getStudentMarks(studentId: string, courseId?: string): Promise<StudentMarksSummary[]> {
    // Find enrolled courses for this student
    const enrolledCourseIds = db.enrollments
      .filter((e) => e.studentId === studentId)
      .map((e) => e.courseId);

    const targetCourseIds = courseId
      ? enrolledCourseIds.filter((id) => id === courseId)
      : enrolledCourseIds;

    const results: StudentMarksSummary[] = [];

    for (const cId of targetCourseIds) {
      const course = db.courses.find((c) => c.id === cId);
      if (!course) continue;

      const items: StudentMarksSummary['items'] = [];
      let totalObtained = 0;
      let totalMax = 0;
      let hasGradedItems = false;

      // 1. Assignments
      const courseAssignments = db.assignments.filter((a) => a.courseId === cId);
      for (const a of courseAssignments) {
        const sub = db.submissions.find(
          (s) => s.assignmentId === a.id && s.studentId === studentId
        );
        let status: 'Graded' | 'Pending' | 'Not Submitted' = 'Not Submitted';
        let obtained: number | null = null;

        if (sub) {
          if (sub.marksObtained !== null && sub.marksObtained !== undefined) {
            status = 'Graded';
            obtained = sub.marksObtained;
            totalObtained += obtained;
            totalMax += a.maxMarks;
            hasGradedItems = true;
          } else {
            status = 'Pending';
          }
        }

        items.push({
          itemId: a.id,
          kind: 'assignment',
          title: a.title,
          obtained,
          max: a.maxMarks,
          status,
          gradedAt: sub?.gradedAt || null,
        });
      }

      // 2. Quizzes
      const courseQuizzes = db.quizzes.filter((q) => q.courseId === cId && q.isPublished);
      for (const q of courseQuizzes) {
        const attempt = db.quizAttempts.find(
          (qa) => qa.quizId === q.id && qa.studentId === studentId
        );
        const questions = db.quizQuestions.filter((qq) => qq.quizId === q.id);
        const maxMarks = questions.reduce((sum, qq) => sum + qq.marks, 0);

        let status: 'Graded' | 'Pending' | 'Not Submitted' = 'Not Submitted';
        let obtained: number | null = null;

        if (attempt && attempt.submittedAt) {
          status = 'Graded';
          obtained = attempt.score ?? 0;
          totalObtained += obtained;
          totalMax += maxMarks;
          hasGradedItems = true;
        }

        items.push({
          itemId: q.id,
          kind: 'quiz',
          title: q.title,
          obtained,
          max: maxMarks,
          status,
          gradedAt: attempt?.submittedAt || null,
        });
      }

      const percentage = hasGradedItems && totalMax > 0
        ? Math.round((totalObtained / totalMax) * 10000) / 100
        : null;

      results.push({
        courseId: cId,
        courseCode: course.code,
        courseTitle: course.title,
        items,
        totalObtained,
        totalMax,
        percentage,
      });
    }

    return results;
  }

  async getGradebookMatrix(courseId: string): Promise<GradebookMatrix> {
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const enrolledStudents = await db.enrollments
      .filter((e) => e.courseId === courseId)
      .map((e) => db.profiles.find((p) => p.id === e.studentId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    const assignments = db.assignments.filter((a) => a.courseId === courseId);
    const quizzes = db.quizzes.filter((q) => q.courseId === courseId);

    const items: GradebookMatrix['items'] = [
      ...assignments.map((a) => ({
        id: a.id,
        title: a.title,
        kind: 'assignment' as const,
        maxMarks: a.maxMarks,
      })),
      ...quizzes.map((q) => {
        const qQuestions = db.quizQuestions.filter((qq) => qq.quizId === q.id);
        const maxMarks = qQuestions.reduce((sum, item) => sum + item.marks, 0);
        return {
          id: q.id,
          title: q.title,
          kind: 'quiz' as const,
          maxMarks,
        };
      }),
    ];

    const students: GradebookMatrix['students'] = [];

    for (const st of enrolledStudents) {
      const marksMap: Record<string, { obtained: number | null; status: 'Graded' | 'Pending' | 'Not Submitted' }> = {};
      let totalObtained = 0;
      let totalMax = 0;
      let hasGraded = false;

      // Assignments
      for (const a of assignments) {
        const sub = db.submissions.find(
          (s) => s.assignmentId === a.id && s.studentId === st.id
        );
        if (sub && sub.marksObtained !== null && sub.marksObtained !== undefined) {
          marksMap[a.id] = { obtained: sub.marksObtained, status: 'Graded' };
          totalObtained += sub.marksObtained;
          totalMax += a.maxMarks;
          hasGraded = true;
        } else if (sub) {
          marksMap[a.id] = { obtained: null, status: 'Pending' };
        } else {
          marksMap[a.id] = { obtained: null, status: 'Not Submitted' };
        }
      }

      // Quizzes
      for (const q of quizzes) {
        const attempt = db.quizAttempts.find(
          (qa) => qa.quizId === q.id && qa.studentId === st.id
        );
        const itemInfo = items.find((i) => i.id === q.id);
        const maxMarks = itemInfo ? itemInfo.maxMarks : 0;

        if (attempt && attempt.submittedAt) {
          const score = attempt.score ?? 0;
          marksMap[q.id] = { obtained: score, status: 'Graded' };
          totalObtained += score;
          totalMax += maxMarks;
          hasGraded = true;
        } else {
          marksMap[q.id] = { obtained: null, status: 'Not Submitted' };
        }
      }

      const percentage = hasGraded && totalMax > 0
        ? Math.round((totalObtained / totalMax) * 10000) / 100
        : null;

      students.push({
        id: st.id,
        fullName: st.fullName,
        rollNo: st.rollNo || null,
        marks: marksMap,
        totalObtained,
        totalMax,
        percentage,
      });
    }

    return { courseId, items, students };
  }

  async generateGradebookCsv(courseId: string): Promise<string> {
    const matrix = await this.getGradebookMatrix(courseId);
    const headers = ['Student ID', 'Full Name', ...matrix.items.map((i) => `"${i.title} (${i.maxMarks} pts)"`), 'Total Obtained', 'Total Max', 'Percentage (%)'];
    
    const rows = matrix.students.map((st) => {
      const studentCols = [
        st.rollNo || st.id,
        `"${st.fullName.replace(/"/g, '""')}"`,
        ...matrix.items.map((item) => {
          const m = st.marks[item.id];
          if (!m || m.status === 'Not Submitted') return '0';
          if (m.status === 'Pending') return 'Pending';
          return String(m.obtained);
        }),
        String(st.totalObtained),
        String(st.totalMax),
        st.percentage !== null ? `${st.percentage}%` : 'N/A',
      ];
      return studentCols.join(',');
    });

    // UTF-8 BOM prefix per spec: \uFEFF
    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  }
}

export const marksRepository = new MarksRepository();
