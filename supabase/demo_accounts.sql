-- DEMO / TESTING ONLY: adds admin, teacher and student logins with password user123.
-- Run in the Supabase SQL editor. Remove these accounts before any production use.
--   admin@gutech.com   / user123
--   teacher@gutech.com / user123
--   student@gutech.com / user123
insert into auth.users (id, instance_id, email, raw_user_meta_data, role, aud, encrypted_password,
                        email_confirmed_at, raw_app_meta_data, confirmation_token, recovery_token,
                        email_change_token_new, email_change, created_at, updated_at)
select v.id::uuid, '00000000-0000-0000-0000-000000000000', v.email,
       jsonb_build_object('full_name', v.full_name), 'authenticated', 'authenticated',
       extensions.crypt('user123', extensions.gen_salt('bf')),
       now(), '{"provider":"email","providers":["email"]}'::jsonb, '', '', '', '', now(), now()
from (values
  ('a0000000-0000-0000-0000-000000000002', 'admin@gutech.com',   'Administrator GUtech'),
  ('b0000000-0000-0000-0000-000000000003', 'teacher@gutech.com', 'Teacher GUtech'),
  ('c0000000-0000-0000-0000-000000000006', 'student@gutech.com', 'Student GUtech')
) as v(id, email, full_name)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.email in ('admin@gutech.com', 'teacher@gutech.com', 'student@gutech.com')
  and not exists (select 1 from auth.identities i where i.user_id = u.id);

insert into public.profiles (id, full_name, email, role, roll_no, is_active, must_change_password)
values
  ('a0000000-0000-0000-0000-000000000002', 'Administrator GUtech', 'admin@gutech.com',   'admin',   null,    true, false),
  ('b0000000-0000-0000-0000-000000000003', 'Teacher GUtech',       'teacher@gutech.com', 'teacher', null,    true, false),
  ('c0000000-0000-0000-0000-000000000006', 'Student GUtech',       'student@gutech.com', 'student', 'S1006', true, false)
on conflict (id) do update
  set role = excluded.role, full_name = excluded.full_name, is_active = true, must_change_password = false;
