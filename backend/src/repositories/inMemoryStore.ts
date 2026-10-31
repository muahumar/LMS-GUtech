import {
  UserProfile,
  Course,
  Resource,
  Assignment,
  Submission,
  Quiz,
  QuizQuestion,
  QuizAnswer,
  QuizAttempt,
  Announcement,
  AnnouncementRead,
  ChatMessage,
  Complaint,
  AuditLog
} from './types.js';

export class InMemoryStore {
  public profiles: UserProfile[] = [];
  public credentials: Map<string, string> = new Map(); // email -> password
  public courses: Course[] = [];
  public courseTeachers: Array<{ courseId: string; teacherId: string }> = [];
  public enrollments: Array<{ courseId: string; studentId: string; enrolledAt: string }> = [];
  public resources: Resource[] = [];
  public assignments: Assignment[] = [];
  public submissions: Submission[] = [];
  public quizzes: Quiz[] = [];
  public quizQuestions: QuizQuestion[] = [];
  public quizAnswers: QuizAnswer[] = [];
  public quizAttempts: QuizAttempt[] = [];
  public announcements: Announcement[] = [];
  public announcementReads: AnnouncementRead[] = [];
  public chatMessages: ChatMessage[] = [];
  public complaints: Complaint[] = [];
  public auditLogs: AuditLog[] = [];

  constructor() {
    this.seed();
  }

  public seed() {
    this.profiles = [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        fullName: 'Administrator GUtech',
        email: 'admin@gutech.edu',
        role: 'admin',
        rollNo: null,
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'b0000000-0000-0000-0000-000000000001',
        fullName: 'Dr. Sarah Al-Balushi',
        email: 'dr.sarah@gutech.edu',
        role: 'teacher',
        rollNo: null,
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'b0000000-0000-0000-0000-000000000002',
        fullName: 'Dr. Tariq Al-Harthi',
        email: 'dr.tariq@gutech.edu',
        role: 'teacher',
        rollNo: null,
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        fullName: 'Ali Al-Khabouri',
        email: 'ali.student@gutech.edu',
        role: 'student',
        rollNo: 'S1001',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        fullName: 'Fatima Al-Riyami',
        email: 'fatima.student@gutech.edu',
        role: 'student',
        rollNo: 'S1002',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        fullName: 'Omar Al-Zadjali',
        email: 'omar.student@gutech.edu',
        role: 'student',
        rollNo: 'S1003',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'c0000000-0000-0000-0000-000000000004',
        fullName: 'Maryam Al-Hinai',
        email: 'maryam.student@gutech.edu',
        role: 'student',
        rollNo: 'S1004',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'c0000000-0000-0000-0000-000000000005',
        fullName: 'Salim Al-Abri',
        email: 'salim.student@gutech.edu',
        role: 'student',
        rollNo: 'S1005',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Standard demo password for all seeded users
    const defaultPass = 'Password123!';
    this.profiles.forEach(p => this.credentials.set(p.email.toLowerCase(), defaultPass));

    // Additional admin account with custom demo credentials
    this.profiles.push({
      id: 'a0000000-0000-0000-0000-000000000002',
      fullName: 'Administrator GUtech',
      email: 'admin@gutech.com',
      role: 'admin',
      rollNo: null,
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    this.credentials.set('admin@gutech.com', 'user123');

    // Additional teacher and student accounts with the same custom demo password
    this.profiles.push(
      {
        id: 'b0000000-0000-0000-0000-000000000003',
        fullName: 'Teacher GUtech',
        email: 'teacher@gutech.com',
        role: 'teacher',
        rollNo: null,
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'c0000000-0000-0000-0000-000000000006',
        fullName: 'Student GUtech',
        email: 'student@gutech.com',
        role: 'student',
        rollNo: 'S1006',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );
    this.credentials.set('teacher@gutech.com', 'user123');
    this.credentials.set('student@gutech.com', 'user123');

    this.courses = [
      {
        id: 'd0000000-0000-0000-0000-000000000001',
        code: 'CS101',
        title: 'Introduction to Computer Science & Algorithms',
        description: 'Fundamental concepts of programming, data representation, logic, and computational problem solving.',
        isArchived: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'd0000000-0000-0000-0000-000000000002',
        code: 'CS204',
        title: 'Database Systems & Cloud Architecture',
        description: 'Relational database theory, SQL mastery, normalization, indexing, and cloud-native database services.',
        isArchived: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'd0000000-0000-0000-0000-000000000003',
        code: 'SE301',
        title: 'Software Architecture & Modern Web Engineering',
        description: 'Designing scalable distributed web applications, enterprise patterns, APIs, and React/Node ecosystems.',
        isArchived: false,
        createdAt: new Date().toISOString()
      }
    ];

    this.courseTeachers = [
      { courseId: 'd0000000-0000-0000-0000-000000000001', teacherId: 'b0000000-0000-0000-0000-000000000001' },
      { courseId: 'd0000000-0000-0000-0000-000000000002', teacherId: 'b0000000-0000-0000-0000-000000000001' },
      { courseId: 'd0000000-0000-0000-0000-000000000003', teacherId: 'b0000000-0000-0000-0000-000000000002' }
    ];

    this.enrollments = [
      { courseId: 'd0000000-0000-0000-0000-000000000001', studentId: 'c0000000-0000-0000-0000-000000000001', enrolledAt: new Date().toISOString() },
      { courseId: 'd0000000-0000-0000-0000-000000000001', studentId: 'c0000000-0000-0000-0000-000000000002', enrolledAt: new Date().toISOString() },
      { courseId: 'd0000000-0000-0000-0000-000000000001', studentId: 'c0000000-0000-0000-0000-000000000003', enrolledAt: new Date().toISOString() },
      { courseId: 'd0000000-0000-0000-0000-000000000002', studentId: 'c0000000-0000-0000-0000-000000000001', enrolledAt: new Date().toISOString() },
      { courseId: 'd0000000-0000-0000-0000-000000000002', studentId: 'c0000000-0000-0000-0000-000000000004', enrolledAt: new Date().toISOString() },
      { courseId: 'd0000000-0000-0000-0000-000000000003', studentId: 'c0000000-0000-0000-0000-000000000002', enrolledAt: new Date().toISOString() },
      { courseId: 'd0000000-0000-0000-0000-000000000003', studentId: 'c0000000-0000-0000-0000-000000000005', enrolledAt: new Date().toISOString() }
    ];

    this.resources = [
      {
        id: 'e0000000-0000-0000-0000-000000000001',
        courseId: 'd0000000-0000-0000-0000-000000000001',
        uploadedBy: 'b0000000-0000-0000-0000-000000000001',
        title: 'CS101 Syllabus & Lecture Schedule',
        description: 'Course syllabus, textbook references, and grading rubrics',
        filePath: 'd0000000-0000-0000-0000-000000000001/syllabus.pdf',
        fileName: 'CS101_Syllabus.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 245000,
        createdAt: new Date().toISOString(),
        uploaderName: 'Dr. Sarah Al-Balushi'
      },
      {
        id: 'e0000000-0000-0000-0000-000000000002',
        courseId: 'd0000000-0000-0000-0000-000000000002',
        uploadedBy: 'b0000000-0000-0000-0000-000000000001',
        title: 'Relational Normalization Guide',
        description: 'Deep dive into 1NF, 2NF, 3NF and BCNF with examples',
        filePath: 'd0000000-0000-0000-0000-000000000002/normalization.pdf',
        fileName: 'Database_Normalization.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 520000,
        createdAt: new Date().toISOString(),
        uploaderName: 'Dr. Sarah Al-Balushi'
      }
    ];

    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    this.assignments = [
      {
        id: 'f0000000-0000-0000-0000-000000000001',
        courseId: 'd0000000-0000-0000-0000-000000000001',
        createdBy: 'b0000000-0000-0000-0000-000000000001',
        title: 'Assignment 1: Sorting Algorithm Benchmarking',
        instructions: 'Implement QuickSort and MergeSort. Submit benchmarking charts and your source code.',
        maxMarks: 100,
        dueAt: nextWeek,
        allowLate: false,
        attachmentPath: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'f0000000-0000-0000-0000-000000000002',
        courseId: 'd0000000-0000-0000-0000-000000000002',
        createdBy: 'b0000000-0000-0000-0000-000000000001',
        title: 'Assignment 1: Schema Design & SQL Queries',
        instructions: 'Design a schema for a hospital registry and write 10 complex queries.',
        maxMarks: 50,
        dueAt: nextWeek,
        allowLate: true,
        attachmentPath: null,
        createdAt: new Date().toISOString()
      }
    ];

    this.submissions = [
      {
        id: 'f1000000-0000-0000-0000-000000000001',
        assignmentId: 'f0000000-0000-0000-0000-000000000001',
        studentId: 'c0000000-0000-0000-0000-000000000001',
        textAnswer: 'Attached is my sorting analysis in TypeScript and C++.',
        filePath: 'submissions/f0000000-0000-0000-0000-000000000001/ali_sorting.zip',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isLate: false,
        marksObtained: 95,
        feedback: 'Excellent algorithmic complexity breakdown and test coverage.',
        gradedBy: 'b0000000-0000-0000-0000-000000000001',
        gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        studentName: 'Ali Al-Khabouri',
        studentRollNo: 'S1001'
      }
    ];

    this.quizzes = [
      {
        id: 'fa000000-0000-0000-0000-000000000001',
        courseId: 'd0000000-0000-0000-0000-000000000001',
        createdBy: 'b0000000-0000-0000-0000-000000000001',
        title: 'Quiz 1: Big-O & Complexity Theory',
        description: 'Assessment on asymptotic notation, best/worst case scenarios.',
        timeLimitMinutes: 20,
        opensAt: new Date(Date.now() - 3600000).toISOString(),
        closesAt: new Date(Date.now() + 48 * 3600000).toISOString(),
        isPublished: true,
        createdAt: new Date().toISOString(),
        totalMarks: 20,
        questionCount: 3
      }
    ];

    this.quizQuestions = [
      {
        id: 'fb000000-0000-0000-0000-000000000001',
        quizId: 'fa000000-0000-0000-0000-000000000001',
        position: 1,
        type: 'mcq_single',
        prompt: 'What is the average time complexity of QuickSort?',
        options: [
          { id: 'a', text: 'O(n)' },
          { id: 'b', text: 'O(n log n)' },
          { id: 'c', text: 'O(n^2)' },
          { id: 'd', text: 'O(log n)' }
        ],
        marks: 5
      },
      {
        id: 'fb000000-0000-0000-0000-000000000002',
        quizId: 'fa000000-0000-0000-0000-000000000001',
        position: 2,
        type: 'true_false',
        prompt: 'MergeSort is an in-place sorting algorithm.',
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' }
        ],
        marks: 5
      },
      {
        id: 'fb000000-0000-0000-0000-000000000003',
        quizId: 'fa000000-0000-0000-0000-000000000001',
        position: 3,
        type: 'mcq_multi',
        prompt: 'Which of the following data structures offer O(1) average lookup?',
        options: [
          { id: 'a', text: 'Hash Table' },
          { id: 'b', text: 'Array (by index)' },
          { id: 'c', text: 'Linked List' },
          { id: 'd', text: 'Binary Search Tree' }
        ],
        marks: 10
      }
    ];

    this.quizAnswers = [
      { questionId: 'fb000000-0000-0000-0000-000000000001', correctOptionIds: ['b'] },
      { questionId: 'fb000000-0000-0000-0000-000000000002', correctOptionIds: ['false'] },
      { questionId: 'fb000000-0000-0000-0000-000000000003', correctOptionIds: ['a', 'b'] }
    ];

    this.quizAttempts = [
      {
        id: 'fc000000-0000-0000-0000-000000000099',
        quizId: 'fa000000-0000-0000-0000-000000000001',
        studentId: 'c0000000-0000-0000-0000-000000000002', // Fatima
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        submittedAt: new Date(Date.now() - 6000000).toISOString(),
        answers: {
          'fb000000-0000-0000-0000-000000000001': ['b'],
          'fb000000-0000-0000-0000-000000000002': ['false'],
          'fb000000-0000-0000-0000-000000000003': ['a', 'b']
        },
        score: 20,
        studentName: 'Fatima Al-Riyami'
      }
    ];

    this.announcements = [
      {
        id: 'fc000000-0000-0000-0000-000000000001',
        courseId: null,
        authorId: 'a0000000-0000-0000-0000-000000000001',
        authorName: 'Administrator GUtech',
        courseCode: null,
        title: 'Welcome to Fall Semester at GUtech!',
        body: 'Welcome to all faculty and students. Please check your course registrations and schedule in this LMS.',
        isPinned: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'fc000000-0000-0000-0000-000000000002',
        courseId: 'd0000000-0000-0000-0000-000000000001',
        authorId: 'b0000000-0000-0000-0000-000000000001',
        authorName: 'Dr. Sarah Al-Balushi',
        courseCode: 'CS101',
        title: 'Lab 2 Workstations Setup Notice',
        body: 'Please ensure you have Docker installed prior to our lab session on Wednesday.',
        isPinned: false,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    this.chatMessages = [
      {
        id: 'fe000000-0000-0000-0000-000000000001',
        courseId: 'd0000000-0000-0000-0000-000000000001',
        senderId: 'b0000000-0000-0000-0000-000000000001',
        senderName: 'Dr. Sarah Al-Balushi',
        senderRole: 'teacher',
        body: 'Hello students, welcome to CS101 classroom chat! Feel free to ask questions here.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        deletedAt: null
      }
    ];

    this.complaints = [
      {
        id: 'fd000000-0000-0000-0000-000000000001',
        raisedBy: 'c0000000-0000-0000-0000-000000000001',
        raisedByName: 'Ali Al-Khabouri',
        raisedByRole: 'student',
        courseId: 'd0000000-0000-0000-0000-000000000001',
        courseCode: 'CS101',
        category: 'facility',
        subject: 'Projector flickering in Lab 304',
        description: 'The HDMI projector display cuts out periodically during afternoon sessions.',
        attachmentPath: null,
        status: 'open',
        adminResponse: null,
        resolvedBy: null,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    this.auditLogs = [];
  }
}

// Global shared store singleton
export const db = new InMemoryStore();
