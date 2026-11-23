import { Link, useNavigate } from "react-router-dom";

export default function RecentStudentsCard({ students, classMap }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Recently Joined
        </h2>
        <Link
          to="/students"
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          View All &rarr;
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-100 py-10 text-center">
          <p className="text-sm text-gray-500">No students enrolled yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const initials = student.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={student.id}
                onClick={() => navigate(`/students/${student.id}`)}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-bold text-white">
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {student.full_name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {classMap[student.class_id] || "Unassigned"} •{" "}
                    {student.joining_date}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
