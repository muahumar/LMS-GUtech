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
