export default function StudentCard({
  student,
  className,
  onOpen,
  onDeleteClick,
}) {
  const initials = student.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={onOpen}
      className="group relative flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md cursor-pointer overflow-hidden"
    >
      {/* Avatar */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-bold">
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

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-bold text-gray-900">
            {student.full_name}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              student.status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {student.status}
          </span>
        </div>

        <p className="mt-1 text-sm font-medium text-gray-600">
          🎓 {className || "Unassigned"}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span>Joined {student.joining_date}</span>
          {student.parent_phone && <span>• 📞 {student.parent_phone}</span>}
        </div>
      </div>

      {/* Hover Overlay with Delete Icon */}
      <div className="pointer-events-none absolute inset-0 bg-slate-900/5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 flex items-start justify-end p-3">
        <button
          type="button"
          title="Delete student"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(student);
          }}
          className="pointer-events-auto rounded-lg bg-white/95 p-2 text-red-600 shadow-sm border border-red-100 hover:bg-red-600 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
