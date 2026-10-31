import { db } from './inMemoryStore.js';
import { UserProfile, UserRole } from './types.js';
import { supabaseAdmin, createSupabaseAuthClient } from '../config/supabase.js';
import { config } from '../config/env.js';
import crypto from 'crypto';

export class UserRepository {
  async findById(id: string): Promise<UserProfile | null> {
    if (config.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return this.mapProfileFromDb(data);
    }
    const user = db.profiles.find((p) => p.id === id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const normalized = email.toLowerCase().trim();
    if (config.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', normalized)
        .single();
      if (error || !data) return null;
      return this.mapProfileFromDb(data);
    }
    const user = db.profiles.find((p) => p.email.toLowerCase() === normalized);
    return user ? { ...user } : null;
  }

  async verifyCredentials(email: string, passwordAttempt: string): Promise<UserProfile | null> {
    const normalized = email.toLowerCase().trim();
    if (config.isSupabaseConfigured()) {
      const { data, error } = await createSupabaseAuthClient().auth.signInWithPassword({
        email: normalized,
        password: passwordAttempt,
      });
      if (error || !data.user) return null;
      return this.findById(data.user.id);
    }

    const storedPassword = db.credentials.get(normalized);
    if (!storedPassword || storedPassword !== passwordAttempt) {
      return null;
    }
    return this.findByEmail(normalized);
  }

  async listUsers(options: {
    page: number;
    pageSize: number;
    role?: UserRole;
    search?: string;
  }): Promise<{ users: UserProfile[]; total: number }> {
    const { page, pageSize, role, search } = options;

    if (config.isSupabaseConfigured()) {
      let query = supabaseAdmin.from('profiles').select('*', { count: 'exact' });
      if (role) query = query.eq('role', role);
      if (search) query = query.ilike('full_name', `%${search}%`);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
      if (error) throw error;
      return {
        users: (data || []).map(this.mapProfileFromDb),
        total: count || 0,
      };
    }

    let filtered = [...db.profiles];
    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          (u.rollNo && u.rollNo.toLowerCase().includes(term))
      );
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return { users: paged.map((u) => ({ ...u })), total };
  }

  async createUser(input: {
    fullName: string;
    email: string;
    role: UserRole;
    rollNo?: string | null;
    password?: string;
    mustChangePassword?: boolean;
  }): Promise<UserProfile> {
    const id = crypto.randomUUID();
    const normalizedEmail = input.email.toLowerCase().trim();
    const tempPassword = input.password || 'TempPass123!';

    if (config.isSupabaseConfigured()) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: input.fullName },
      });
      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create auth user');
      }

      const { data: profileData, error: profError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: input.fullName,
          email: normalizedEmail,
          role: input.role,
          roll_no: input.rollNo || null,
          is_active: true,
          must_change_password: input.mustChangePassword ?? true,
        })
        .select()
        .single();

      if (profError) throw profError;
      return this.mapProfileFromDb(profileData);
    }

    const newUser: UserProfile = {
      id,
      fullName: input.fullName,
      email: normalizedEmail,
      role: input.role,
      rollNo: input.rollNo || null,
      isActive: true,
      mustChangePassword: input.mustChangePassword ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.profiles.push(newUser);
    db.credentials.set(normalizedEmail, tempPassword);
    return { ...newUser };
  }

  async updateUser(
    id: string,
    updates: Partial<{
      fullName: string;
      role: UserRole;
      rollNo?: string | null;
      isActive: boolean;
      mustChangePassword: boolean;
    }>
  ): Promise<UserProfile | null> {
    if (config.isSupabaseConfigured()) {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.rollNo !== undefined) dbUpdates.roll_no = updates.rollNo;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.mustChangePassword !== undefined) dbUpdates.must_change_password = updates.mustChangePassword;

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return null;
      return this.mapProfileFromDb(data);
    }

    const user = db.profiles.find((p) => p.id === id);
    if (!user) return null;

    if (updates.fullName !== undefined) user.fullName = updates.fullName;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.rollNo !== undefined) user.rollNo = updates.rollNo;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    if (updates.mustChangePassword !== undefined) user.mustChangePassword = updates.mustChangePassword;
    user.updatedAt = new Date().toISOString();

    return { ...user };
  }

  async updatePassword(email: string, newPassword: string): Promise<boolean> {
    const normalized = email.toLowerCase().trim();
    if (config.isSupabaseConfigured()) {
      const user = await this.findByEmail(normalized);
      if (!user) return false;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });
      if (error) return false;
      await this.updateUser(user.id, { mustChangePassword: false });
      return true;
    }

    if (!db.credentials.has(normalized)) return false;
    db.credentials.set(normalized, newPassword);
    const user = db.profiles.find((p) => p.email.toLowerCase() === normalized);
    if (user) {
      user.mustChangePassword = false;
    }
    return true;
  }

  private mapProfileFromDb(row: any): UserProfile {
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      rollNo: row.roll_no,
      isActive: row.is_active,
      mustChangePassword: row.must_change_password,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const userRepository = new UserRepository();
