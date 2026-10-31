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
