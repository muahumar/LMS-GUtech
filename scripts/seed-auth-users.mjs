// Creates (or resets the password of) the demo login accounts in Supabase Auth
// and upserts their profile rows, so that email + password login works.
// Usage (from repo root):  node scripts/seed-auth-users.mjs
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(path.resolve('backend', 'package.json'));
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve('backend', '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in backend/.env');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD = 'Password123!';
const users = [
  { email: 'admin@gutech.edu', fullName: 'Administrator GUtech', role: 'admin', rollNo: null },
  { email: 'dr.sarah@gutech.edu', fullName: 'Dr. Sarah Al-Balushi', role: 'teacher', rollNo: null },
  { email: 'dr.tariq@gutech.edu', fullName: 'Dr. Tariq Al-Harthi', role: 'teacher', rollNo: null },
  { email: 'ali.student@gutech.edu', fullName: 'Ali Al-Khabouri', role: 'student', rollNo: 'S1001' },
  { email: 'fatima.student@gutech.edu', fullName: 'Fatima Al-Riyami', role: 'student', rollNo: 'S1002' },
  { email: 'omar.student@gutech.edu', fullName: 'Omar Al-Zadjali', role: 'student', rollNo: 'S1003' },
  { email: 'maryam.student@gutech.edu', fullName: 'Maryam Al-Hinai', role: 'student', rollNo: 'S1004' },
  { email: 'salim.student@gutech.edu', fullName: 'Salim Al-Abri', role: 'student', rollNo: 'S1005' },
];

const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listErr) {
  console.error('Cannot reach Supabase auth:', listErr.message);
  process.exit(1);
}

for (const u of users) {
  let existing = list.users.find((x) => x.email?.toLowerCase() === u.email);
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
    if (error) { console.error(`update ${u.email}:`, error.message); continue; }
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: u.fullName },
    });
    if (error) { console.error(`create ${u.email}:`, error.message); continue; }
    existing = data.user;
  }
  // Remove stale profile rows with the same email but a different id (from seed.sql fixed UUIDs)
  await supabase.from('profiles').delete().eq('email', u.email).neq('id', existing.id);
  const { error: pErr } = await supabase.from('profiles').upsert({
    id: existing.id, full_name: u.fullName, email: u.email, role: u.role,
    roll_no: u.rollNo, is_active: true, must_change_password: false,
  });
  console.log(pErr ? `profile ${u.email}: ${pErr.message}` : `ok  ${u.email}`);
}
console.log(`\nDone. Password for all demo users: ${PASSWORD}`);
