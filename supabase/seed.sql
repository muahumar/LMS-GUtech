-- Seed Data: supabase/seed.sql
-- 1 Admin, 2 Teachers, 5 Students, 3 Courses with assignments, quizzes, announcements

-- Auth users setup (for local Postgres/Supabase test environments)
insert into auth.users (id, email, raw_user_meta_data, role, aud)
values 
    ('a0000000-0000-0000-0000-000000000001', 'admin@gutech.edu', '{"full_name":"Administrator GUtech"}', 'authenticated', 'authenticated'),
    ('b0000000-0000-0000-0000-000000000001', 'dr.sarah@gutech.edu', '{"full_name":"Dr. Sarah Al-Balushi"}', 'authenticated', 'authenticated'),
    ('b0000000-0000-0000-0000-000000000002', 'dr.tariq@gutech.edu', '{"full_name":"Dr. Tariq Al-Harthi"}', 'authenticated', 'authenticated'),
    ('c0000000-0000-0000-0000-000000000001', 'ali.student@gutech.edu', '{"full_name":"Ali Al-Khabouri"}', 'authenticated', 'authenticated'),
    ('c0000000-0000-0000-0000-000000000002', 'fatima.student@gutech.edu', '{"full_name":"Fatima Al-Riyami"}', 'authenticated', 'authenticated'),
    ('c0000000-0000-0000-0000-000000000003', 'omar.student@gutech.edu', '{"full_name":"Omar Al-Zadjali"}', 'authenticated', 'authenticated'),
    ('c0000000-0000-0000-0000-000000000004', 'maryam.student@gutech.edu', '{"full_name":"Maryam Al-Hinai"}', 'authenticated', 'authenticated'),
    ('c0000000-0000-0000-0000-000000000005', 'salim.student@gutech.edu', '{"full_name":"Salim Al-Abri"}', 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- Profiles
insert into profiles (id, full_name, email, role, roll_no, is_active, must_change_password)
values
    ('a0000000-0000-0000-0000-000000000001', 'Administrator GUtech', 'admin@gutech.edu', 'admin', null, true, false),
    ('b0000000-0000-0000-0000-000000000001', 'Dr. Sarah Al-Balushi', 'dr.sarah@gutech.edu', 'teacher', null, true, false),
    ('b0000000-0000-0000-0000-000000000002', 'Dr. Tariq Al-Harthi', 'dr.tariq@gutech.edu', 'teacher', null, true, false),
    ('c0000000-0000-0000-0000-000000000001', 'Ali Al-Khabouri', 'ali.student@gutech.edu', 'student', 'S1001', true, false),
    ('c0000000-0000-0000-0000-000000000002', 'Fatima Al-Riyami', 'fatima.student@gutech.edu', 'student', 'S1002', true, false),
    ('c0000000-0000-0000-0000-000000000003', 'Omar Al-Zadjali', 'omar.student@gutech.edu', 'student', 'S1003', true, false),
    ('c0000000-0000-0000-0000-000000000004', 'Maryam Al-Hinai', 'maryam.student@gutech.edu', 'student', 'S1004', true, false),
    ('c0000000-0000-0000-0000-000000000005', 'Salim Al-Abri', 'salim.student@gutech.edu', 'student', 'S1005', true, false)
on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    roll_no = excluded.roll_no,
    is_active = excluded.is_active;

-- Courses
insert into courses (id, code, title, description, is_archived)
values
    ('d0000000-0000-0000-0000-000000000001', 'CS101', 'Introduction to Computer Science & Algorithms', 'Fundamental concepts of programming, data representation, logic, and computational problem solving.', false),
    ('d0000000-0000-0000-0000-000000000002', 'CS204', 'Database Systems & Cloud Architecture', 'Relational database theory, SQL mastery, normalization, indexing, and cloud-native database services.', false),
    ('d0000000-0000-0000-0000-000000000003', 'SE301', 'Software Architecture & Modern Web Engineering', 'Designing scalable distributed web applications, enterprise patterns, APIs, and React/Node ecosystems.', false)
on conflict (id) do nothing;

-- Course Teachers
insert into course_teachers (course_id, teacher_id)
values
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002')
on conflict do nothing;

-- Enrollments
insert into enrollments (course_id, student_id)
values
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004'),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002'),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005')
on conflict do nothing;

-- Sample Resources
insert into resources (id, course_id, uploaded_by, title, description, file_path, file_name, mime_type, size_bytes)
values
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS101 Syllabus & Lecture Schedule', 'Course syllabus, textbook references, and grading rubrics', 'd0000000-0000-0000-0000-000000000001/syllabus.pdf', 'CS101_Syllabus.pdf', 'application/pdf', 245000),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Relational Normalization Guide', 'Deep dive into 1NF, 2NF, 3NF and BCNF with examples', 'd0000000-0000-0000-0000-000000000002/normalization.pdf', 'Database_Normalization.pdf', 'application/pdf', 520000)
on conflict do nothing;

-- Sample Assignments
insert into assignments (id, course_id, created_by, title, instructions, max_marks, due_at, allow_late)
values
    ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Assignment 1: Sorting Algorithm Benchmarking', 'Implement QuickSort and MergeSort. Submit benchmarking charts and your source code.', 100.00, now() + interval '7 days', false),
    ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Assignment 1: Schema Design & SQL Queries', 'Design a schema for a hospital registry and write 10 complex queries.', 50.00, now() + interval '5 days', true)
on conflict do nothing;

-- Sample Submission & Grade
insert into submissions (id, assignment_id, student_id, text_answer, file_path, submitted_at, is_late, marks_obtained, feedback, graded_by, graded_at)
values
    ('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Attached is my sorting analysis in TypeScript and C++.', 'submissions/f0000000-0000-0000-0000-000000000001/ali_sorting.zip', now() - interval '2 days', false, 95.00, 'Excellent algorithmic complexity breakdown and test coverage.', 'b0000000-0000-0000-0000-000000000001', now() - interval '1 day')
on conflict do nothing;

-- Sample Quizzes
insert into quizzes (id, course_id, created_by, title, description, time_limit_minutes, opens_at, closes_at, is_published)
values
    ('fa000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Quiz 1: Big-O & Complexity Theory', 'Assessment on asymptotic notation, best/worst case scenarios.', 20, now() - interval '1 hour', now() + interval '48 hours', true)
on conflict do nothing;

-- Quiz Questions
insert into quiz_questions (id, quiz_id, position, type, prompt, options, marks)
values
    ('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000001', 1, 'mcq_single', 'What is the average time complexity of QuickSort?', '[{"id":"a","text":"O(n)"},{"id":"b","text":"O(n log n)"},{"id":"c","text":"O(n^2)"},{"id":"d","text":"O(log n)"}]'::jsonb, 5.00),
    ('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000001', 2, 'true_false', 'MergeSort is an in-place sorting algorithm.', '[{"id":"true","text":"True"},{"id":"false","text":"False"}]'::jsonb, 5.00),
    ('fb000000-0000-0000-0000-000000000003', 'fa000000-0000-0000-0000-000000000001', 3, 'mcq_multi', 'Which of the following data structures offer O(1) average lookup?', '[{"id":"a","text":"Hash Table"},{"id":"b","text":"Array (by index)"},{"id":"c","text":"Linked List"},{"id":"d","text":"Binary Search Tree"}]'::jsonb, 10.00)
on conflict do nothing;

-- Quiz Answers (Protected)
insert into quiz_answers (question_id, correct_option_ids)
values
    ('fb000000-0000-0000-0000-000000000001', array['b']),
    ('fb000000-0000-0000-0000-000000000002', array['false']),
    ('fb000000-0000-0000-0000-000000000003', array['a','b'])
on conflict do nothing;

-- Sample Announcements
insert into announcements (id, course_id, author_id, title, body, is_pinned)
values
    ('fc000000-0000-0000-0000-000000000001', null, 'a0000000-0000-0000-0000-000000000001', 'Welcome to Fall Semester at GUtech!', 'Welcome to all faculty and students. Please check your course registrations and schedule in this LMS.', true),
    ('fc000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Lab 2 Workstations Setup Notice', 'Please ensure you have Docker installed prior to our lab session on Wednesday.', false)
on conflict do nothing;

-- Sample Complaints
insert into complaints (id, raised_by, course_id, category, subject, description, status)
values
    ('fd000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'facility', 'Projector flickering in Lab 304', 'The HDMI projector display cuts out periodically during afternoon sessions.', 'open')
on conflict do nothing;

-- Sample Chat Message
insert into chat_messages (id, course_id, sender_id, body)
values
    ('fe000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Hello students, welcome to CS101 classroom chat! Feel free to ask questions here.')
on conflict do nothing;
