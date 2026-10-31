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
