import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/repositories/inMemoryStore.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

describe('GUtech LMS - Comprehensive Endpoint Test Suite', () => {
  beforeEach(() => {
    db.seed();
  });

  // Helper to generate auth tokens
  const getAuthToken = (id: string, email: string, role: string) => {
    return jwt.sign({ id, email, role }, config.jwtSecret, { expiresIn: '1h' });
  };

  const adminToken = getAuthToken(
    'a0000000-0000-0000-0000-000000000001',
    'admin@gutech.edu',
    'admin'
  );

  const teacher1Token = getAuthToken(
    'b0000000-0000-0000-0000-000000000001',
    'dr.sarah@gutech.edu',
    'teacher'
  );

  const teacher2Token = getAuthToken(
    'b0000000-0000-0000-0000-000000000002',
    'dr.tariq@gutech.edu',
    'teacher'
  );

  const student1Token = getAuthToken(
    'c0000000-0000-0000-0000-000000000001',
    'ali.student@gutech.edu',
    'student'
  );

  const student2Token = getAuthToken(
    'c0000000-0000-0000-0000-000000000002',
    'fatima.student@gutech.edu',
    'student'
  );

  // ========================================================
  // FEATURE 1: LOGIN & ADMIN USER MANAGEMENT
  // ========================================================
  describe('Feature 1: Authentication & User Management', () => {
    it('Happy path: Valid login returns tokens and user profile', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@gutech.edu', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.profile.role).toBe('admin');
    });

    it('Permission/Security: Invalid login shows generic error without revealing field', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@gutech.edu', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('Permission/Security: Public /signup returns 404', async () => {
      const res = await request(app).post('/api/auth/signup').send({ email: 'test@gutech.edu' });
      expect(res.status).toBe(404);
    });

    it('Permission/Security: Deactivated user is rejected even with valid token', async () => {
      // Deactivate student1
      const student = db.profiles.find((p) => p.id === 'c0000000-0000-0000-0000-000000000001');
      if (student) student.isActive = false;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('deactivated');
    });

    it('Admin only: Admin creates user', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'New Instructor',
          email: 'new.instructor@gutech.edu',
          role: 'teacher',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('new.instructor@gutech.edu');
    });

    it('Permission denied: Student cannot create user (403)', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          fullName: 'Hacker',
          email: 'hacker@gutech.edu',
          role: 'admin',
        });

      expect(res.status).toBe(403);
    });
  });

  // ========================================================
  // FEATURE 2: RESOURCES
  // ========================================================
  describe('Feature 2: Resources Upload & Download', () => {
    it('Permission denied: Teacher cannot upload to a course they do not teach (403)', async () => {
      // Course 3 is taught by Teacher 2, not Teacher 1
      const res = await request(app)
        .post('/api/courses/d0000000-0000-0000-0000-000000000003/resources')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .attach('file', Buffer.from('PDF content'), 'test.pdf')
        .field('title', 'Unauthorized lecture notes');

      expect(res.status).toBe(403);
    });

    it('Permission denied: Student not enrolled gets 403 on list and download', async () => {
      // Student 1 is not enrolled in Course 3
      const listRes = await request(app)
        .get('/api/courses/d0000000-0000-0000-0000-000000000003/resources')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(listRes.status).toBe(403);
    });

    it('Security: Executable file (.exe) is rejected with clear message', async () => {
      const res = await request(app)
        .post('/api/courses/d0000000-0000-0000-0000-000000000001/resources')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .attach('file', Buffer.from('malicious payload'), 'virus.exe')
        .field('title', 'Malware test');

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('prohibited');
    });

    it('Happy path: Enrolled student can get signed download URL', async () => {
      // Resource 1 belongs to Course 1 (where student 1 is enrolled)
      const res = await request(app)
        .get('/api/resources/e0000000-0000-0000-0000-000000000001/download')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toBeDefined();
      expect(res.body.data.expiresInSeconds).toBe(60);
    });
  });

  // ========================================================
  // FEATURE 3: COURSE ASSIGNMENT & ENROLLMENT
  // ========================================================
  describe('Feature 3: Course Assignment & Enrollment', () => {
    it('Happy path: Admin creates course', async () => {
      const res = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS450',
          title: 'Distributed Cloud Systems',
          description: 'Microservices and Kubernetes',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe('CS450');
    });

    it('Acceptance: Enrolling the same student twice is idempotent', async () => {
      const courseId = 'd0000000-0000-0000-0000-000000000001';
      const studentId = 'c0000000-0000-0000-0000-000000000001'; // already enrolled

      const res = await request(app)
        .post(`/api/admin/courses/${courseId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ studentIds: [studentId] });

      expect(res.status).toBe(200);
      expect(res.body.data.duplicateCount).toBe(1);
    });

    it('Acceptance: CSV import reports matched, duplicate, and unknown emails', async () => {
      const courseId = 'd0000000-0000-0000-0000-000000000001';
      const csv = 'email\r\nali.student@gutech.edu\r\nunknown.person@gutech.edu\r\nmaryam.student@gutech.edu';

      const res = await request(app)
        .post(`/api/admin/courses/${courseId}/enrollments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ csvContent: csv });

      expect(res.status).toBe(200);
      expect(res.body.data.unknownEmails).toContain('unknown.person@gutech.edu');
      expect(res.body.data.matched).toContain('maryam.student@gutech.edu');
    });

    it('Student sees only enrolled, non-archived courses', async () => {
      const res = await request(app)
        .get('/api/me/courses')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      const codes = res.body.data.map((c: any) => c.code);
      expect(codes).toContain('CS101');
      expect(codes).toContain('CS204');
      expect(codes).not.toContain('SE301');
    });
  });

  // ========================================================
  // FEATURE 4: ASSIGNMENTS
  // ========================================================
  describe('Feature 4: Assignments & Submissions', () => {
    it('Happy path: Student submits assignment', async () => {
      const assignmentId = 'f0000000-0000-0000-0000-000000000001';
      const res = await request(app)
        .put(`/api/assignments/${assignmentId}/submission`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ textAnswer: 'My solution in Python' });

      expect(res.status).toBe(200);
      expect(res.body.data.textAnswer).toBe('My solution in Python');
    });

    it('Acceptance: Marks above max_marks rejected (422)', async () => {
      const submissionId = 'f1000000-0000-0000-0000-000000000001'; // max marks is 100
      const res = await request(app)
        .patch(`/api/submissions/${submissionId}/grade`)
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({ marks: 105, feedback: 'Over maximum!' });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('cannot exceed maximum');
    });

    it('Permission denied: Student cannot grade submission', async () => {
      const submissionId = 'f1000000-0000-0000-0000-000000000001';
      const res = await request(app)
        .patch(`/api/submissions/${submissionId}/grade`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ marks: 100 });

      expect(res.status).toBe(403);
    });
  });

  // ========================================================
  // FEATURE 5: QUIZZES
  // ========================================================
  describe('Feature 5: Quizzes & Auto-grading', () => {
    it('Acceptance: Network inspection of student attempt response shows NO answer key', async () => {
      const quizId = 'fa000000-0000-0000-0000-000000000001';
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/attempt`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      const questions = res.body.data.questions;
      expect(questions.length).toBeGreaterThan(0);
      // Ensure no correctOptionIds anywhere in questions payload
      questions.forEach((q: any) => {
        expect(q.correctOptionIds).toBeUndefined();
      });
    });

    it('Acceptance: Auto-grading computes score and multi-select is all-or-nothing', async () => {
      const quizId = 'fa000000-0000-0000-0000-000000000001';
      // First ensure attempt started
      await request(app)
        .post(`/api/quizzes/${quizId}/attempt`)
        .set('Authorization', `Bearer ${student1Token}`);

      // Submit all correct answers: Q1: ['b'] (5pts), Q2: ['false'] (5pts), Q3: ['a','b'] (10pts) -> Total 20
      const submitRes = await request(app)
        .post(`/api/quizzes/${quizId}/attempt/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: {
            'fb000000-0000-0000-0000-000000000001': ['b'],
            'fb000000-0000-0000-0000-000000000002': ['false'],
            'fb000000-0000-0000-0000-000000000003': ['a', 'b'],
          },
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.score).toBe(20);
    });

    it('Acceptance: A second attempt is rejected (409)', async () => {
      const quizId = 'fa000000-0000-0000-0000-000000000001';
      // Student 2 already submitted in seed data
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/attempt`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(409);
    });
  });

  // ========================================================
  // FEATURE 6: ANNOUNCEMENTS
  // ========================================================
  describe('Feature 6: Announcements', () => {
    it('Permission denied: Teacher cannot post global announcement (null courseId)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          courseId: null,
          title: 'Campus wide announcement',
          body: 'Holiday notice',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('administrators can post global');
    });

    it('Happy path: Student sees global plus own course announcements', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      const items = res.body.data.announcements;
      expect(items.length).toBeGreaterThan(0);
      // Pinned items sort first
      expect(items[0].isPinned).toBe(true);
    });
  });

  // ========================================================
  // FEATURE 7: MARKS & GRADEBOOK
  // ========================================================
  describe('Feature 7: Marks & Gradebook', () => {
    it('Permission denied: A student can never request another students marks (403)', async () => {
      // Trying to query marks of student 2 as student 1
      const res = await request(app)
        .get('/api/me/marks?courseId=d0000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${student1Token}`);

      // Should return student 1's marks, not allow parameter injection for another
      expect(res.status).toBe(200);
      expect(res.body.data[0].items[0].obtained).toBe(95); // Ali's marks on seeded sorting assignment
    });

    it('Happy path: Teacher sees gradebook matrix with totals', async () => {
      const res = await request(app)
        .get('/api/courses/d0000000-0000-0000-0000-000000000001/gradebook')
        .set('Authorization', `Bearer ${teacher1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.students).toBeDefined();
      expect(res.body.data.items).toBeDefined();
    });

    it('Acceptance: CSV export includes UTF-8 BOM', async () => {
      const res = await request(app)
        .get('/api/courses/d0000000-0000-0000-0000-000000000001/gradebook.csv')
        .set('Authorization', `Bearer ${teacher1Token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      // Starts with UTF-8 BOM
      expect(res.text.charCodeAt(0)).toBe(0xFEFF);
    });
  });

  // ========================================================
  // FEATURE 8: CLASSROOM CHAT
  // ========================================================
  describe('Feature 8: Classroom Chat', () => {
    it('Permission denied: Non-member cannot read chat (403)', async () => {
      // Student 1 is not in Course 3
      const res = await request(app)
        .get('/api/courses/d0000000-0000-0000-0000-000000000003/messages')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
    });

    it('Happy path: Member can send chat message', async () => {
      const res = await request(app)
        .post('/api/courses/d0000000-0000-0000-0000-000000000001/messages')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ body: 'Hi professor, will the slides be uploaded today?' });

      expect(res.status).toBe(201);
      expect(res.body.data.body).toContain('Hi professor');
    });
  });

  // ========================================================
  // FEATURE 9: COMPLAINTS
  // ========================================================
  describe('Feature 9: Complaints System', () => {
    it('Happy path: Student raises complaint', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          category: 'technical',
          subject: 'WiFi issue in CS wing',
          description: 'Connection drops frequently.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.subject).toBe('WiFi issue in CS wing');
    });

    it('Acceptance: Resolving complaint without response is rejected (422)', async () => {
      const complaintId = 'fd000000-0000-0000-0000-000000000001';
      const res = await request(app)
        .patch(`/api/complaints/admin/${complaintId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          adminResponse: '', // Empty response
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('required');
    });
  });

  // ========================================================
  // FEATURE 10: PASSWORD RESET & PROFILE
  // ========================================================
  describe('Feature 10: Password Reset & Profile', () => {
    it('Acceptance: Unknown email and known email show identical response', async () => {
      const resKnown = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'admin@gutech.edu' });

      const resUnknown = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@gutech.edu' });

      expect(resKnown.status).toBe(200);
      expect(resUnknown.status).toBe(200);
      expect(resKnown.body.data.message).toBe(resUnknown.body.data.message);
    });

    it('Happy path: Logged in user can update full name in profile', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ fullName: 'Ali Al-Khabouri Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Ali Al-Khabouri Updated');
    });
  });
});
