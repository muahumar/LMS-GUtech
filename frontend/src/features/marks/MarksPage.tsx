import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../auth/AuthContext.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { Badge } from '../../components/ui/Badge.js';
import { Award, FileSpreadsheet, BookOpen, CheckCircle2 } from 'lucide-react';

export const MarksPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [studentMarksData, setStudentMarksData] = useState<any[]>([]);
  const [gradebookMatrix, setGradebookMatrix] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const myCourses = await api.get<any[]>('/me/courses');
      setCourses(Array.isArray(myCourses) ? myCourses : []);

      if (role === 'student') {
        const marks = await api.get<any[]>('/me/marks', {
          courseId: selectedCourseId || undefined,
        });
        setStudentMarksData(Array.isArray(marks) ? marks : []);
      } else {
        const activeCourse = selectedCourseId || (myCourses[0]?.id ?? '');
        if (activeCourse) {
          setSelectedCourseId(activeCourse);
          const matrix = await api.get<any>(`/courses/${activeCourse}/gradebook`);
          setGradebookMatrix(matrix);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load grade records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCourseId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {role === 'student' ? 'Academic Transcripts & Marks' : 'Institutional Gradebook Matrix'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'student'
              ? 'Real-time performance across all enrolled coursework and quizzes'
              : 'Complete grade matrix across assignments and auto-graded assessments'}
          </p>
        </div>

        {role !== 'student' && selectedCourseId && (
          <a
            href={`/api/courses/${selectedCourseId}/gradebook.csv`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-600" />
            <span>Export CSV (UTF-8 BOM)</span>
          </a>
        )}
      </div>

      {/* Course filter for teacher/admin */}
      {role !== 'student' && courses.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 uppercase">Select Class:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-brand-500"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Calculating marks and metrics..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : role === 'student' ? (
        /* Student View */
        studentMarksData.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No marks recorded"
            description="Submitted assignments and completed quizzes will be aggregated here once evaluated."
          />
        ) : (
          <div className="space-y-6">
            {studentMarksData.map((courseSummary) => (
              <div
                key={courseSummary.courseId}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {courseSummary.courseCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {courseSummary.courseTitle}
                    </h3>
                  </div>

                  {courseSummary.percentage !== null && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Overall Percentage
                      </span>
                      <div className="text-2xl font-black text-brand-600">
                        {courseSummary.percentage}%
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {courseSummary.totalObtained} / {courseSummary.totalMax} pts
                      </div>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Assessment Deliverable</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Points Earned</th>
                        <th className="px-4 py-3">Max Possible</th>
                        <th className="px-4 py-3">Evaluation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courseSummary.items.map((item: any) => (
                        <tr key={item.itemId}>
                          <td className="px-4 py-3.5 font-bold text-slate-900">{item.title}</td>
                          <td className="px-4 py-3.5 text-slate-500 uppercase text-[11px] font-medium">
                            {item.kind}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-brand-700 text-sm">
                            {item.obtained !== null ? item.obtained : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">{item.max}</td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant={
                                item.status === 'Graded'
                                  ? 'success'
                                  : item.status === 'Pending'
                                  ? 'warning'
                                  : 'slate'
                              }
                              size="sm"
                            >
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Teacher / Admin Gradebook Matrix View */
        !gradebookMatrix || gradebookMatrix.students?.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No student evaluations found"
            description="Enrolled students who submit coursework will be tracked in this grade matrix."
          />
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10">Enrolled Student</th>
                  {gradebookMatrix.items?.map((item: any) => (
                    <th key={item.id} className="px-4 py-3 text-center whitespace-nowrap">
                      <div>{item.title}</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({item.maxMarks} pts)
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">Aggregate Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {gradebookMatrix.students.map((st: any) => (
                  <tr key={st.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900 sticky left-0 bg-white">
                      <div>{st.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{st.rollNo}</div>
                    </td>
                    {gradebookMatrix.items?.map((item: any) => {
                      const m = st.marks[item.id];
                      return (
                        <td key={item.id} className="px-4 py-3 text-center font-mono">
                          {m && m.status === 'Graded' ? (
                            <span className="font-bold text-brand-700">{m.obtained}</span>
                          ) : m && m.status === 'Pending' ? (
                            <span className="text-amber-600 text-[10px]">Pending</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-black text-brand-700">
                      {st.percentage !== null ? `${st.percentage}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};
