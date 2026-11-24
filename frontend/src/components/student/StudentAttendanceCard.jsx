import { useStudentAttendance } from "../../hooks/useAttendance";

const BADGE_STYLES = {
  PRESENT: "bg-green-100 text-green-700",
  LATE: "bg-amber-100 text-amber-700",
  ABSENT: "bg-red-100 text-red-700",
};

export default function StudentAttendanceCard({ studentId }) {
  const { data, isLoading } = useStudentAttendance(studentId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm text-sm text-gray-400">
        Loading attendance...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Attendance History
        </h2>
        {data?.total_days > 0 && (
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            {data.attendance_percentage}% Attended
          </span>
        )}
      </div>

      {!data || data.total_days === 0 ? (
        <p className="rounded-lg border-2 border-dashed border-gray-100 py-8 text-center text-sm text-gray-400">
          No attendance recorded yet.
        </p>
      ) : (
        <>
          <div className="mb-4 flex gap-4 text-xs font-medium text-gray-600">
            <span className="text-green-600">Present: {data.present_days}</span>
            <span className="text-amber-600">Late: {data.late_days}</span>
            <span className="text-red-600">Absent: {data.absent_days}</span>
          </div>

          <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
            {data.records.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium text-gray-800">{rec.date}</span>
                  {rec.remarks && (
                    <span className="ml-2 text-xs text-gray-400">
                      • {rec.remarks}
                    </span>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    BADGE_STYLES[rec.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {rec.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
