import { useRef } from "react";
import { Link } from "react-router-dom";
import { useUploadStudentPhoto } from "../../hooks/useStudents";
import { formatTime } from "../batch/BatchCard";

export default function StudentHeader({ student, className, onEditClick }) {
  const fileInputRef = useRef(null);
  const {
    mutate: uploadPhoto,
    isPending,
    error,
  } = useUploadStudentPhoto(student.id);

  const initials = student.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPhoto(file);
    e.target.value = "";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          {/* Interactive Avatar */}
          <div
            onClick={() => !isPending && fileInputRef.current?.click()}
            className="relative h-16 w-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold shrink-0 cursor-pointer overflow-hidden group"
            title="Click to upload photo"
          >
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={student.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}

            <div
              className={`absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-medium text-white transition-opacity ${
                isPending ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {isPending ? "..." : "Edit"}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
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

            {/* Assigned Batches */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {student.batches && student.batches.length > 0 ? (
                student.batches.map((batch) => (
                  <Link
                    key={batch.id}
                    to={`/batches/${batch.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <span>🕒 {batch.name}</span>
                    <span className="text-blue-400">
                      ({formatTime(batch.start_time)} –{" "}
                      {formatTime(batch.end_time)})
                    </span>
                  </Link>
                ))
              ) : (
                <span className="text-xs text-gray-400">No batch assigned</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onEditClick}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
        >
          Edit Profile
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}
