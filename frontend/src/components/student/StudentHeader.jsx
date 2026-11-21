export default function StudentHeader({ student, className }) {
  const initials = student.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
      <div className="flex items-center gap-5">
        {/* Photo Placeholder */}
        <div className="h-16 w-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold shrink-0">
          {initials}
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {student.full_name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                student.status === "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {student.status}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>🎓 {className || "Unassigned"}</span>
            <span>•</span>
            <span>Joined {student.joining_date}</span>
          </div>
        </div>
      </div>

      {/* Placeholder for future Edit / Photo Upload */}
      <button
        disabled
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
        title="Coming soon"
      >
        Edit Profile
      </button>
    </div>
  );
}
