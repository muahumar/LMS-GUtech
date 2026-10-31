-- Makes the seeded auth users usable by Supabase Auth (password login).
-- seed.sql inserted raw rows into auth.users without a password or the fields GoTrue expects.
-- This keeps the same user IDs, so all seeded courses/enrollments stay linked.
-- Password for every demo account: Password123!
update auth.users
set instance_id = '00000000-0000-0000-0000-000000000000',
    encrypted_password = extensions.crypt('Password123!', extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
    confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    email_change = coalesce(email_change, ''),
    created_at = coalesce(created_at, now()),
    updated_at = now()
where email like '%@gutech.edu';

-- GoTrue also expects a matching identity row per email user
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.email like '%@gutech.edu'
  and not exists (select 1 from auth.identities i where i.user_id = u.id);
