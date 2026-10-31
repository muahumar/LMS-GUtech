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
