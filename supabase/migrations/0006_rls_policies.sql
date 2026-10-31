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
