import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClasses, useCreateClass } from "../hooks/useCurriculum";

export default function Curriculum() {
  const { data: classes = [], isLoading, error } = useClasses();
  const { mutateAsync: addClass, isPending } = useCreateClass();

  const [newClassName, setNewClassName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    await addClass({ name: newClassName });
    setNewClassName("");
    setIsAdding(false);
  };

  if (isLoading)
    return <div className="p-8 text-gray-500">Loading curriculum...</div>;
  if (error)
    return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Curriculum Overview
        </h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {isAdding ? "Cancel" : "+ Add Class"}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddClass}
          className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4"
        >
          <input
            type="text"
            autoFocus
            placeholder="e.g. Class 10, Grade 8..."
            className="flex-1 rounded-lg border border-gray-300 p-2 outline-none focus:border-slate-900"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Class"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {classes.length === 0 && !isAdding && (
          <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-100">
            No classes created yet. Click "+ Add Class" to start.
          </div>
        )}

        {classes.map((cls) => (
          <div
            key={cls.id}
            onClick={() => navigate(`/curriculum/${cls.id}`)}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                {cls.name}
              </h2>
              <div className="flex gap-6 mt-2 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  📚 Subjects: <span className="text-gray-900">0</span>
                </span>
                <span className="flex items-center gap-1">
                  🎓 Enrolled Students: <span className="text-gray-900">0</span>
                </span>
              </div>
            </div>

            <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
