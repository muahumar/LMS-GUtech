import { db } from './inMemoryStore.js';
import { Course, UserProfile } from './types.js';
import { supabaseAdmin } from '../config/supabase.js';
import { config } from '../config/env.js';
import crypto from 'crypto';

export class CourseRepository {
  async findById(id: string): Promise<Course | null> {
    if (config.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return this.mapCourseFromDb(data);
    }
    const c = db.courses.find((x) => x.id === id);
    return c ? { ...c } : null;
  }

  async findByCode(code: string): Promise<Course | null> {
    const normalized = code.toUpperCase().trim();
    if (config.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('courses')
        .select('*')
        .eq('code', normalized)
        .single();
      if (error || !data) return null;
      return this.mapCourseFromDb(data);
    }
    const c = db.courses.find((x) => x.code.toUpperCase() === normalized);
    return c ? { ...c } : null;
  }

  async listCourses(options: {
    page: number;
    pageSize: number;
    search?: string;
    includeArchived?: boolean;
  }): Promise<{ courses: Course[]; total: number }> {
    const { page, pageSize, search, includeArchived = false } = options;

    if (config.isSupabaseConfigured()) {
      let query = supabaseAdmin.from('courses').select('*', { count: 'exact' });
      if (!includeArchived) query = query.eq('is_archived', false);
      if (search) query = query.ilike('title', `%${search}%`);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
      if (error) throw error;
      return {
        courses: (data || []).map(this.mapCourseFromDb),
        total: count || 0,
      };
    }

    let filtered = [...db.courses];
    if (!includeArchived) {
      filtered = filtered.filter((c) => !c.isArchived);
    }
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (c) => c.title.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return { courses: paged.map((c) => ({ ...c })), total };
  }

  async createCourse(input: {
    code: string;
    title: string;
    description?: string;
  }): Promise<Course> {
    const id = crypto.randomUUID();
    const code = input.code.toUpperCase().trim();

    if (config.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('courses')
        .insert({
          code,
          title: input.title,
          description: input.description || null,
          is_archived: false,
        })
        .select()
        .single();
      if (error) throw error;
      return this.mapCourseFromDb(data);
    }

    const newCourse: Course = {
      id,
      code,
      title: input.title,
      description: input.description || null,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    db.courses.push(newCourse);
    return { ...newCourse };
  }

  async updateCourse(
    id: string,
    updates: Partial<{
      title: string;
      description?: string;
      isArchived: boolean;
    }>
  ): Promise<Course | null> {
    if (config.isSupabaseConfigured()) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;

      const { data, error } = await supabaseAdmin
        .from('courses')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return null;
      return this.mapCourseFromDb(data);
    }

    const course = db.courses.find((c) => c.id === id);
    if (!course) return null;

    if (updates.title !== undefined) course.title = updates.title;
    if (updates.description !== undefined) course.description = updates.description;
    if (updates.isArchived !== undefined) course.isArchived = updates.isArchived;

    return { ...course };
  }

  async getTeachers(courseId: string): Promise<UserProfile[]> {
    if (config.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('course_teachers')
        .select('profiles (*)')
        .eq('course_id', courseId);
      if (error) return [];
      return (data || []).map((row: any) => ({
        id: row.profiles.id,
        fullName: row.profiles.full_name,
        email: row.profiles.email,
        role: row.profiles.role,
        rollNo: row.profiles.roll_no,
        isActive: row.profiles.is_active,
        mustChangePassword: row.profiles.must_change_password,
        createdAt: row.profiles.created_at,
        updatedAt: row.profiles.updated_at,
      }));
    }

    const teacherIds = db.courseTeachers
      .filter((ct) => ct.courseId === courseId)
      .map((ct) => ct.teacherId);
    return db.profiles
      .filter((p) => teacherIds.includes(p.id))
      .map((p) => ({ ...p }));
  }

  async replaceTeachers(courseId: string, teacherIds: string[]): Promise<UserProfile[]> {
    if (config.isSupabaseConfigured()) {
      await supabaseAdmin.from('course_teachers').delete().eq('course_id', courseId);
      if (teacherIds.length > 0) {
        const rows = teacherIds.map((teacherId) => ({ course_id: courseId, teacher_id: teacherId }));
        await supabaseAdmin.from('course_teachers').insert(rows);
      }
      return this.getTeachers(courseId);
    }

    db.courseTeachers = db.courseTeachers.filter((ct) => ct.courseId !== courseId);
    for (const tId of teacherIds) {
      db.courseTeachers.push({ courseId, teacherId: tId });
    }
    return this.getTeachers(courseId);
  }

  async enrollStudents(
    courseId: string,
    studentIds: string[]
  ): Promise<{ enrolled: number; duplicates: number }> {
    let enrolled = 0;
    let duplicates = 0;

    for (const sId of studentIds) {
      const already = db.enrollments.some(
        (e) => e.courseId === courseId && e.studentId === sId
      );
      if (already) {
        duplicates++;
      } else {
        db.enrollments.push({
          courseId,
          studentId: sId,
          enrolledAt: new Date().toISOString(),
        });
        enrolled++;
      }
    }
    return { enrolled, duplicates };
  }

  async unenrollStudent(courseId: string, studentId: string): Promise<boolean> {
    const before = db.enrollments.length;
    db.enrollments = db.enrollments.filter(
      (e) => !(e.courseId === courseId && e.studentId === studentId)
    );
    return db.enrollments.length < before;
  }

  async getEnrolledStudents(courseId: string): Promise<UserProfile[]> {
    const sIds = db.enrollments
      .filter((e) => e.courseId === courseId)
      .map((e) => e.studentId);
    return db.profiles.filter((p) => sIds.includes(p.id)).map((p) => ({ ...p }));
  }

  async getCoursesForUser(userId: string, role: string): Promise<Course[]> {
    if (role === 'admin') {
      return db.courses.map((c) => ({ ...c }));
    }

    if (role === 'teacher') {
      const taughtCourseIds = db.courseTeachers
        .filter((ct) => ct.teacherId === userId)
        .map((ct) => ct.courseId);
      return db.courses
        .filter((c) => taughtCourseIds.includes(c.id))
        .map((c) => ({ ...c }));
    }

    // student
    const enrolledCourseIds = db.enrollments
      .filter((e) => e.studentId === userId)
      .map((e) => e.courseId);
    return db.courses
      .filter((c) => enrolledCourseIds.includes(c.id) && !c.isArchived)
      .map((c) => ({ ...c }));
  }

  async isEnrolled(courseId: string, studentId: string): Promise<boolean> {
    return db.enrollments.some(
      (e) => e.courseId === courseId && e.studentId === studentId
    );
  }

  async teaches(courseId: string, teacherId: string): Promise<boolean> {
    return db.courseTeachers.some(
      (ct) => ct.courseId === courseId && ct.teacherId === teacherId
    );
  }

  private mapCourseFromDb(row: any): Course {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      isArchived: row.is_archived,
      createdAt: row.created_at,
    };
  }
}

export const courseRepository = new CourseRepository();
