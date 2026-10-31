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
