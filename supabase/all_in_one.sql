-- ===== 0001_core.sql =====
-- Migration: 0001_core.sql
-- Description: Core tables - Profiles, Courses, Course Teachers, Enrollments

create extension if not exists pgcrypto;

-- Enums
do $$ begin
    create type user_role as enum ('admin', 'teacher', 'student');
exception
    when duplicate_object then null;
end $$;

-- 1. Profiles (matches auth.users.id)
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null unique,
    role user_role not null,
    roll_no text unique, -- students only
    is_active boolean not null default true,
    must_change_password boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Courses
create table if not exists courses (
    id uuid primary key default gen_random_uuid(),
    code text not null unique, -- e.g. CS101
    title text not null,
    description text,
    is_archived boolean not null default false,
    created_at timestamptz not null default now()
);

-- 3. Course Teachers (M:N courses <-> teachers)
create table if not exists course_teachers (
    course_id uuid references courses(id) on delete cascade,
    teacher_id uuid references profiles(id) on delete cascade,
    primary key (course_id, teacher_id)
);

-- 4. Enrollments (M:N courses <-> students)
create table if not exists enrollments (
    course_id uuid references courses(id) on delete cascade,
    student_id uuid references profiles(id) on delete cascade,
    enrolled_at timestamptz not null default now(),
    primary key (course_id, student_id)
);
-- ===== 0002_resources.sql =====
-- Migration: 0002_resources.sql
-- Description: Course resources table and storage buckets setup

-- Resources table
create table if not exists resources (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references courses(id) on delete cascade,
    uploaded_by uuid not null references profiles(id),
    title text not null,
    description text,
    file_path text not null, -- path in 'resources' bucket
    file_name text not null,
    mime_type text not null,
    size_bytes bigint not null,
    created_at timestamptz not null default now()
);

-- Ensure Supabase storage buckets exist
insert into storage.buckets (id, name, public)
values 
    ('resources', 'resources', false),
    ('submissions', 'submissions', false),
    ('complaint-attachments', 'complaint-attachments', false)
on conflict (id) do nothing;
-- ===== 0003_assessments.sql =====
-- Migration: 0003_assessments.sql
-- Description: Assignments, Submissions, Quizzes, Questions, Answers, Attempts

-- 1. Assignments
create table if not exists assignments (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references courses(id) on delete cascade,
    created_by uuid not null references profiles(id),
    title text not null,
    instructions text not null,
    max_marks numeric(6,2) not null check (max_marks > 0),
    due_at timestamptz not null,
    allow_late boolean not null default false,
    attachment_path text,
    created_at timestamptz not null default now()
);

-- 2. Submissions
create table if not exists submissions (
    id uuid primary key default gen_random_uuid(),
    assignment_id uuid not null references assignments(id) on delete cascade,
    student_id uuid not null references profiles(id) on delete cascade,
    text_answer text,
    file_path text,
    submitted_at timestamptz not null default now(),
    is_late boolean not null default false,
    marks_obtained numeric(6,2),
    feedback text,
    graded_by uuid references profiles(id),
    graded_at timestamptz,
    unique (assignment_id, student_id)
);

-- 3. Quizzes & Question Types
do $$ begin
    create type question_type as enum ('mcq_single', 'mcq_multi', 'true_false');
exception
    when duplicate_object then null;
end $$;

create table if not exists quizzes (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references courses(id) on delete cascade,
    created_by uuid not null references profiles(id),
    title text not null,
    description text,
    time_limit_minutes int not null check (time_limit_minutes > 0),
    opens_at timestamptz not null,
    closes_at timestamptz not null,
    is_published boolean not null default false,
    created_at timestamptz not null default now(),
    check (closes_at > opens_at)
);

-- 4. Quiz Questions
create table if not exists quiz_questions (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references quizzes(id) on delete cascade,
    position int not null,
    type question_type not null,
    prompt text not null,
    options jsonb not null, -- [{"id":"a","text":"..."}]
    marks numeric(5,2) not null default 1
);

-- 5. Quiz Answers (Teacher/Admin only)
create table if not exists quiz_answers (
    question_id uuid primary key references quiz_questions(id) on delete cascade,
    correct_option_ids text[] not null
);

-- 6. Quiz Attempts
create table if not exists quiz_attempts (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references quizzes(id) on delete cascade,
    student_id uuid not null references profiles(id) on delete cascade,
    started_at timestamptz not null default now(),
    submitted_at timestamptz,
    answers jsonb not null default '{}', -- {question_id: [option_ids]}
    score numeric(6,2),
    unique (quiz_id, student_id)
);
-- ===== 0004_collaboration.sql =====
-- Migration: 0004_collaboration.sql
-- Description: Announcements, Announcement Reads, Chat, Complaints, Audit Log

-- 1. Announcements
create table if not exists announcements (
    id uuid primary key default gen_random_uuid(),
    course_id uuid references courses(id) on delete cascade, -- null = global
    author_id uuid not null references profiles(id),
    title text not null,
    body text not null,
    is_pinned boolean not null default false,
    created_at timestamptz not null default now()
);

-- 2. Announcement Reads
create table if not exists announcement_reads (
    user_id uuid references profiles(id) on delete cascade,
    announcement_id uuid references announcements(id) on delete cascade,
    read_at timestamptz not null default now(),
    primary key (user_id, announcement_id)
);

-- 3. Audit Log
create table if not exists audit_log (
    id bigint generated always as identity primary key,
    actor_id uuid references profiles(id),
    action text not null,
    entity text not null,
    entity_id uuid,
    at timestamptz not null default now()
);

-- 4. Classroom Chat Messages
create table if not exists chat_messages (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references courses(id) on delete cascade,
    sender_id uuid not null references profiles(id),
    body text not null check (char_length(body) between 1 and 2000),
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

-- 5. Complaints
do $$ begin
    create type complaint_status as enum ('open', 'in_review', 'resolved', 'rejected');
exception
    when duplicate_object then null;
end $$;

create table if not exists complaints (
    id uuid primary key default gen_random_uuid(),
    raised_by uuid not null references profiles(id),
    course_id uuid references courses(id),
    category text not null, -- academic, technical, facility, conduct, other
    subject text not null,
    description text not null,
    attachment_path text,
    status complaint_status not null default 'open',
    admin_response text,
    resolved_by uuid references profiles(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- ===== 0005_views_and_helpers.sql =====
-- Migration: 0005_views_and_helpers.sql
-- Description: Indexes, Security Definer Helper Functions, and v_student_marks View

-- 1. Performance Indexes
create index if not exists idx_enrollments_student on enrollments (student_id);
create index if not exists idx_course_teachers_teacher on course_teachers (teacher_id);
create index if not exists idx_resources_course_created on resources (course_id, created_at desc);
create index if not exists idx_assignments_course_due on assignments (course_id, due_at);
create index if not exists idx_submissions_assignment on submissions (assignment_id);
create index if not exists idx_submissions_student on submissions (student_id);
create index if not exists idx_quiz_attempts_quiz on quiz_attempts (quiz_id);
create index if not exists idx_quiz_attempts_student on quiz_attempts (student_id);
create index if not exists idx_announcements_course_created on announcements (course_id, created_at desc);
create index if not exists idx_chat_messages_course_created on chat_messages (course_id, created_at desc);
create index if not exists idx_complaints_status_created on complaints (status, created_at desc);
create index if not exists idx_complaints_raised_by on complaints (raised_by);

-- 2. SQL Helper Functions (Security Definer)
create or replace function public.is_enrolled(check_course_id uuid)
returns boolean
language sql
security definer
stable
as $$
    select exists (
        select 1 from public.enrollments
        where course_id = check_course_id
        and student_id = auth.uid()
    );
$$;

create or replace function public.teaches(check_course_id uuid)
returns boolean
language sql
security definer
stable
as $$
    select exists (
        select 1 from public.course_teachers
        where course_id = check_course_id
        and teacher_id = auth.uid()
    );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role = 'admin'
        and is_active = true
    );
$$;

-- 3. Marks View (v_student_marks)
create or replace view public.v_student_marks as
select 
    s.student_id,
    a.course_id,
    'assignment'::text as kind,
    a.id as item_id,
    a.title,
    s.marks_obtained as obtained,
    a.max_marks as max,
    s.graded_at
from public.submissions s
join public.assignments a on a.id = s.assignment_id

union all

select 
    qa.student_id,
    q.course_id,
    'quiz'::text as kind,
    q.id as item_id,
    q.title,
    qa.score as obtained,
    coalesce((select sum(qq.marks) from public.quiz_questions qq where qq.quiz_id = q.id), 0) as max,
    qa.submitted_at as graded_at
from public.quiz_attempts qa
join public.quizzes q on q.id = qa.quiz_id;
-- ===== 0006_rls_policies.sql =====
-- Migration: 0006_rls_policies.sql
-- Description: Enable RLS and define security policies for all tables

-- 1. Enable RLS on every table
alter table profiles enable row level security;
alter table courses enable row level security;
alter table course_teachers enable row level security;
alter table enrollments enable row level security;
alter table resources enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_answers enable row level security;
alter table quiz_attempts enable row level security;
alter table announcements enable row level security;
alter table announcement_reads enable row level security;
alter table audit_log enable row level security;
alter table chat_messages enable row level security;
alter table complaints enable row level security;

-- ==========================================
-- PROFILES POLICIES
-- ==========================================
create policy "Users can read own profile"
    on profiles for select
    using (auth.uid() = id or is_admin());

create policy "Teachers can read enrolled students profiles"
    on profiles for select
    using (
        exists (
            select 1 from enrollments e
            join course_teachers ct on ct.course_id = e.course_id
            where ct.teacher_id = auth.uid() and e.student_id = profiles.id
        )
    );

create policy "Admin can insert and update profiles"
    on profiles for all
    using (is_admin())
    with check (is_admin());

-- ==========================================
-- COURSES POLICIES
-- ==========================================
create policy "Courses are viewable by assigned teachers, enrolled students, or admin"
    on courses for select
    using (
        is_admin()
        or teaches(id)
        or (is_enrolled(id) and not is_archived)
    );

create policy "Admin has full management on courses"
    on courses for all
    using (is_admin())
    with check (is_admin());

-- ==========================================
-- COURSE TEACHERS POLICIES
-- ==========================================
create policy "Course teachers viewable by course members and admin"
    on course_teachers for select
    using (
        is_admin()
        or teaches(course_id)
        or is_enrolled(course_id)
    );

create policy "Admin manages course teachers"
    on course_teachers for all
    using (is_admin())
    with check (is_admin());

-- ==========================================
-- ENROLLMENTS POLICIES
-- ==========================================
create policy "Enrollments viewable by student, course teacher, or admin"
    on enrollments for select
    using (
        student_id = auth.uid()
        or teaches(course_id)
        or is_admin()
    );

create policy "Admin manages enrollments"
    on enrollments for all
    using (is_admin())
    with check (is_admin());

-- ==========================================
-- RESOURCES POLICIES
-- ==========================================
create policy "Resources viewable by course members and admin"
    on resources for select
    using (
        is_enrolled(course_id)
        or teaches(course_id)
        or is_admin()
    );

create policy "Teachers can upload resources to own courses"
    on resources for insert
    with check (
        (teaches(course_id) and uploaded_by = auth.uid())
        or is_admin()
    );

create policy "Uploader or admin can delete resources"
    on resources for delete
    using (
        uploaded_by = auth.uid()
        or is_admin()
    );

-- ==========================================
-- ASSIGNMENTS POLICIES
-- ==========================================
create policy "Assignments viewable by enrolled students, teachers, or admin"
    on assignments for select
    using (
        is_enrolled(course_id)
        or teaches(course_id)
        or is_admin()
    );

create policy "Teachers can insert assignments to their courses"
    on assignments for insert
    with check (
        (teaches(course_id) and created_by = auth.uid())
        or is_admin()
    );

create policy "Teachers can update/delete their own assignments"
    on assignments for update
    using (
        (created_by = auth.uid() and teaches(course_id))
        or is_admin()
    );

create policy "Teachers can delete their own assignments"
    on assignments for delete
    using (
        (created_by = auth.uid() and teaches(course_id))
        or is_admin()
    );

-- ==========================================
-- SUBMISSIONS POLICIES
-- ==========================================
create policy "Students view own submissions; teachers and admin view course submissions"
    on submissions for select
    using (
        student_id = auth.uid()
        or exists (
            select 1 from assignments a
            where a.id = submissions.assignment_id
            and (teaches(a.course_id) or is_admin())
        )
    );

create policy "Students can submit work to their enrolled courses"
    on submissions for insert
    with check (
        student_id = auth.uid()
        and exists (
            select 1 from assignments a
            where a.id = assignment_id and is_enrolled(a.course_id)
        )
    );

create policy "Students can update their own submission"
    on submissions for update
    using (student_id = auth.uid())
    with check (student_id = auth.uid());

create policy "Teachers can grade course submissions"
    on submissions for update
    using (
        exists (
            select 1 from assignments a
            where a.id = submissions.assignment_id
            and (teaches(a.course_id) or is_admin())
        )
    );

-- ==========================================
-- QUIZZES & QUESTIONS POLICIES
-- ==========================================
create policy "Quizzes viewable by enrolled students if published or by teachers"
    on quizzes for select
    using (
        (is_enrolled(course_id) and is_published = true)
        or teaches(course_id)
        or is_admin()
    );

create policy "Teachers manage quizzes for their courses"
    on quizzes for all
    using (teaches(course_id) or is_admin())
    with check (teaches(course_id) or is_admin());

create policy "Quiz questions viewable by members of published quiz"
    on quiz_questions for select
    using (
        exists (
            select 1 from quizzes q
            where q.id = quiz_questions.quiz_id
            and ((is_enrolled(q.course_id) and q.is_published = true) or teaches(q.course_id) or is_admin())
        )
    );

create policy "Teachers manage quiz questions"
    on quiz_questions for all
    using (
        exists (
            select 1 from quizzes q
            where q.id = quiz_questions.quiz_id
            and (teaches(q.course_id) or is_admin())
        )
    );

-- ==========================================
-- QUIZ ANSWERS (TEACHER / ADMIN ONLY)
-- ==========================================
-- Students MUST NEVER have select/insert/update/delete on quiz_answers!
create policy "Only teachers and admins can view quiz answers"
    on quiz_answers for select
    using (
        exists (
            select 1 from quiz_questions qq
            join quizzes q on q.id = qq.quiz_id
            where qq.id = quiz_answers.question_id
            and (teaches(q.course_id) or is_admin())
        )
    );

create policy "Only teachers and admins can modify quiz answers"
    on quiz_answers for all
    using (
        exists (
            select 1 from quiz_questions qq
            join quizzes q on q.id = qq.quiz_id
            where qq.id = quiz_answers.question_id
            and (teaches(q.course_id) or is_admin())
        )
    );

-- ==========================================
-- QUIZ ATTEMPTS POLICIES
-- ==========================================
create policy "Students view own attempts, teachers view course quiz attempts"
    on quiz_attempts for select
    using (
        student_id = auth.uid()
        or exists (
            select 1 from quizzes q
            where q.id = quiz_attempts.quiz_id
            and (teaches(q.course_id) or is_admin())
        )
    );

create policy "Students can insert their own quiz attempt"
    on quiz_attempts for insert
    with check (
        student_id = auth.uid()
        and exists (
            select 1 from quizzes q
            where q.id = quiz_id and is_enrolled(q.course_id) and q.is_published = true
        )
    );

create policy "Students can submit their own quiz attempt"
    on quiz_attempts for update
    using (student_id = auth.uid())
    with check (student_id = auth.uid());

-- ==========================================
-- ANNOUNCEMENTS POLICIES
-- ==========================================
create policy "Announcements viewable by target course members or all if global"
    on announcements for select
    using (
        course_id is null
        or is_enrolled(course_id)
        or teaches(course_id)
        or is_admin()
    );

create policy "Admins can post global announcements, teachers post to their courses"
    on announcements for insert
    with check (
        (course_id is null and is_admin())
        or (course_id is not null and (teaches(course_id) or is_admin()))
    );

create policy "Announcement authors and admins can update/delete"
    on announcements for all
    using (author_id = auth.uid() or is_admin());

-- Announcement Reads
create policy "Users manage their own announcement reads"
    on announcement_reads for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- ==========================================
-- CHAT MESSAGES POLICIES
-- ==========================================
create policy "Course members and admin can read chat messages"
    on chat_messages for select
    using (
        is_enrolled(course_id)
        or teaches(course_id)
        or is_admin()
    );

create policy "Course members can send chat messages"
    on chat_messages for insert
    with check (
        sender_id = auth.uid()
        and (is_enrolled(course_id) or teaches(course_id))
    );

create policy "Sender within 5m or teacher/admin can delete chat message"
    on chat_messages for update
    using (
        (sender_id = auth.uid() and now() <= created_at + interval '5 minutes')
        or teaches(course_id)
        or is_admin()
    );

-- ==========================================
-- COMPLAINTS POLICIES
-- ==========================================
create policy "Users view own complaints, Admin views all complaints"
    on complaints for select
    using (raised_by = auth.uid() or is_admin());

create policy "Users can raise complaints"
    on complaints for insert
    with check (raised_by = auth.uid());

create policy "Only admin can resolve or update complaints"
    on complaints for update
    using (is_admin())
    with check (is_admin());

-- ==========================================
-- AUDIT LOG POLICIES
-- ==========================================
create policy "Audit log readable only by admin"
    on audit_log for select
    using (is_admin());
-- ===== seed.sql =====
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
