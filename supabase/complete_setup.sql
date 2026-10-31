-- ====================================================================
-- GUTECH INTERNAL LMS: COMPLETE ALL-IN-ONE SUPABASE DATABASE SETUP
-- Paste this entire script into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lprpmnorxfhrfwmwkqmh/sql
-- Click "Run" (or Ctrl + Enter).
-- ====================================================================

-- 1. CORE EXTENSIONS & ENUMS
create extension if not exists pgcrypto;

do $$ begin
    create type user_role as enum ('admin', 'teacher', 'student');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type question_type as enum ('mcq_single', 'mcq_multi', 'true_false');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type complaint_status as enum ('open', 'in_review', 'resolved', 'rejected');
exception
    when duplicate_object then null;
end $$;

-- 2. TABLES
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null unique,
    role user_role not null,
    roll_no text unique,
    is_active boolean not null default true,
    must_change_password boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.courses (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    title text not null,
    description text,
    is_archived boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.course_teachers (
    course_id uuid references public.courses(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade,
    primary key (course_id, teacher_id)
);

create table if not exists public.enrollments (
    course_id uuid references public.courses(id) on delete cascade,
    student_id uuid references public.profiles(id) on delete cascade,
    enrolled_at timestamptz not null default now(),
    primary key (course_id, student_id)
);

create table if not exists public.resources (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    uploaded_by uuid not null references public.profiles(id),
    title text not null,
    description text,
    file_path text not null,
    file_name text not null,
    mime_type text not null,
    size_bytes bigint not null,
    created_at timestamptz not null default now()
);

create table if not exists public.assignments (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    created_by uuid not null references public.profiles(id),
    title text not null,
    instructions text not null,
    max_marks numeric(6,2) not null check (max_marks > 0),
    due_at timestamptz not null,
    allow_late boolean not null default false,
    attachment_path text,
    created_at timestamptz not null default now()
);

create table if not exists public.submissions (
    id uuid primary key default gen_random_uuid(),
    assignment_id uuid not null references public.assignments(id) on delete cascade,
    student_id uuid not null references public.profiles(id) on delete cascade,
    text_answer text,
    file_path text,
    submitted_at timestamptz not null default now(),
    is_late boolean not null default false,
    marks_obtained numeric(6,2),
    feedback text,
    graded_by uuid references public.profiles(id),
    graded_at timestamptz,
    unique (assignment_id, student_id)
);

create table if not exists public.quizzes (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    created_by uuid not null references public.profiles(id),
    title text not null,
    description text,
    time_limit_minutes int not null check (time_limit_minutes > 0),
    opens_at timestamptz not null,
    closes_at timestamptz not null,
    is_published boolean not null default false,
    created_at timestamptz not null default now(),
    check (closes_at > opens_at)
);

create table if not exists public.quiz_questions (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references public.quizzes(id) on delete cascade,
    position int not null,
    type question_type not null,
    prompt text not null,
    options jsonb not null,
    marks numeric(5,2) not null default 1
);

create table if not exists public.quiz_answers (
    question_id uuid primary key references public.quiz_questions(id) on delete cascade,
    correct_option_ids text[] not null
);

create table if not exists public.quiz_attempts (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references public.quizzes(id) on delete cascade,
    student_id uuid not null references public.profiles(id) on delete cascade,
    started_at timestamptz not null default now(),
    submitted_at timestamptz,
    answers jsonb not null default '{}',
    score numeric(6,2),
    unique (quiz_id, student_id)
);

create table if not exists public.announcements (
    id uuid primary key default gen_random_uuid(),
    course_id uuid references public.courses(id) on delete cascade,
    author_id uuid not null references public.profiles(id),
    title text not null,
    body text not null,
    is_pinned boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.announcement_reads (
    user_id uuid references public.profiles(id) on delete cascade,
    announcement_id uuid references public.announcements(id) on delete cascade,
    read_at timestamptz not null default now(),
    primary key (user_id, announcement_id)
);

create table if not exists public.audit_log (
    id bigint generated always as identity primary key,
    actor_id uuid references public.profiles(id),
    action text not null,
    entity text not null,
    entity_id uuid,
    at timestamptz not null default now()
);

create table if not exists public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    sender_id uuid not null references public.profiles(id),
    body text not null check (char_length(body) between 1 and 2000),
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

create table if not exists public.complaints (
    id uuid primary key default gen_random_uuid(),
    raised_by uuid not null references public.profiles(id),
    course_id uuid references public.courses(id),
    category text not null,
    subject text not null,
    description text not null,
    attachment_path text,
    status complaint_status not null default 'open',
    admin_response text,
    resolved_by uuid references public.profiles(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. STORAGE BUCKETS
insert into storage.buckets (id, name, public)
values 
    ('resources', 'resources', false),
    ('submissions', 'submissions', false),
    ('complaint-attachments', 'complaint-attachments', false)
on conflict (id) do nothing;

-- 4. INDEXES
create index if not exists idx_enrollments_student on public.enrollments (student_id);
create index if not exists idx_course_teachers_teacher on public.course_teachers (teacher_id);
create index if not exists idx_resources_course_created on public.resources (course_id, created_at desc);
create index if not exists idx_assignments_course_due on public.assignments (course_id, due_at);
create index if not exists idx_submissions_assignment on public.submissions (assignment_id);
create index if not exists idx_submissions_student on public.submissions (student_id);
create index if not exists idx_quiz_attempts_quiz on public.quiz_attempts (quiz_id);
create index if not exists idx_quiz_attempts_student on public.quiz_attempts (student_id);
create index if not exists idx_announcements_course_created on public.announcements (course_id, created_at desc);
create index if not exists idx_chat_messages_course_created on public.chat_messages (course_id, created_at desc);
create index if not exists idx_complaints_status_created on public.complaints (status, created_at desc);

-- 5. SECURITY DEFINER HELPER FUNCTIONS
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

-- 6. MARKS VIEW
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

-- 7. ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_teachers enable row level security;
alter table public.enrollments enable row level security;
alter table public.resources enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.audit_log enable row level security;
alter table public.chat_messages enable row level security;
alter table public.complaints enable row level security;

-- 8. RLS POLICIES
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "Courses are viewable by members or admin" on public.courses for select using (public.is_admin() or public.teaches(id) or (public.is_enrolled(id) and not is_archived));
create policy "Admin full courses access" on public.courses for all using (public.is_admin()) with check (public.is_admin());
create policy "Resources viewable by course members" on public.resources for select using (public.is_enrolled(course_id) or public.teaches(course_id) or public.is_admin());
create policy "Assignments viewable by enrolled" on public.assignments for select using (public.is_enrolled(course_id) or public.teaches(course_id) or public.is_admin());
create policy "Submissions viewable by student or teacher" on public.submissions for select using (student_id = auth.uid() or public.teaches((select course_id from public.assignments where id = assignment_id)) or public.is_admin());
create policy "Quizzes viewable by enrolled or teacher" on public.quizzes for select using ((public.is_enrolled(course_id) and is_published = true) or public.teaches(course_id) or public.is_admin());
create policy "Only teachers and admins can view quiz answers" on public.quiz_answers for all using (public.is_admin() or exists (select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id where qq.id = question_id and public.teaches(q.course_id)));
create policy "Announcements readable by members" on public.announcements for select using (course_id is null or public.is_enrolled(course_id) or public.teaches(course_id) or public.is_admin());
create policy "Chat messages readable by members" on public.chat_messages for select using (public.is_enrolled(course_id) or public.teaches(course_id) or public.is_admin());
create policy "Complaints readable by owner or admin" on public.complaints for select using (raised_by = auth.uid() or public.is_admin());

-- 9. SEED ACCOUNTS & DATA
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

insert into public.profiles (id, full_name, email, role, roll_no, is_active, must_change_password)
values
    ('a0000000-0000-0000-0000-000000000001', 'Administrator GUtech', 'admin@gutech.edu', 'admin', null, true, false),
    ('b0000000-0000-0000-0000-000000000001', 'Dr. Sarah Al-Balushi', 'dr.sarah@gutech.edu', 'teacher', null, true, false),
    ('b0000000-0000-0000-0000-000000000002', 'Dr. Tariq Al-Harthi', 'dr.tariq@gutech.edu', 'teacher', null, true, false),
    ('c0000000-0000-0000-0000-000000000001', 'Ali Al-Khabouri', 'ali.student@gutech.edu', 'student', 'S1001', true, false),
    ('c0000000-0000-0000-0000-000000000002', 'Fatima Al-Riyami', 'fatima.student@gutech.edu', 'student', 'S1002', true, false),
    ('c0000000-0000-0000-0000-000000000003', 'Omar Al-Zadjali', 'omar.student@gutech.edu', 'student', 'S1003', true, false),
    ('c0000000-0000-0000-0000-000000000004', 'Maryam Al-Hinai', 'maryam.student@gutech.edu', 'student', 'S1004', true, false),
    ('c0000000-0000-0000-0000-000000000005', 'Salim Al-Abri', 'salim.student@gutech.edu', 'student', 'S1005', true, false)
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;

insert into public.courses (id, code, title, description, is_archived)
values
    ('d0000000-0000-0000-0000-000000000001', 'CS101', 'Introduction to Computer Science & Algorithms', 'Fundamental concepts of programming, data representation, logic, and computational problem solving.', false),
    ('d0000000-0000-0000-0000-000000000002', 'CS204', 'Database Systems & Cloud Architecture', 'Relational database theory, SQL mastery, normalization, indexing, and cloud-native database services.', false),
    ('d0000000-0000-0000-0000-000000000003', 'SE301', 'Software Architecture & Modern Web Engineering', 'Designing scalable distributed web applications, enterprise patterns, APIs, and React/Node ecosystems.', false)
on conflict (id) do nothing;

insert into public.course_teachers (course_id, teacher_id)
values
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002')
on conflict do nothing;

insert into public.enrollments (course_id, student_id)
values
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004'),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002'),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005')
on conflict do nothing;
