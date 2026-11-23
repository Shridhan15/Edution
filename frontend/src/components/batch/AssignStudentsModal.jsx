import { useState, useMemo } from "react";
import { useStudents } from "../../hooks/useStudents";
import { useAddStudentsToBatch } from "../../hooks/useBatches";

export default function AssignStudentsModal({ isOpen, onClose, batch }) {
  const { data: allStudents = [] } = useStudents();
  const { mutateAsync: assignStudents, isPending } = useAddStudentsToBatch(
    batch?.id,
  );

  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");

  const existingIds = useMemo(
    () => new Set((batch?.students || []).map((s) => s.id)),
    [batch],
  );

  const availableStudents = useMemo(() => {
    return allStudents.filter((s) => {
      if (existingIds.has(s.id)) return false;
      if (search && !s.full_name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [allStudents, existingIds, search]);

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) return;
    await assignStudents(selectedIds);
    setSelectedIds([]);
    setSearch("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Assign Students</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder="Search students by name..."
          className="mb-4 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {availableStudents.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No unassigned students found.
            </p>
          ) : (
            availableStudents.map((student) => {
              const checked = selectedIds.includes(student.id);
              return (
                <label
                  key={student.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    checked
                      ? "border-blue-500 bg-blue-50/40"
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelect(student.id)}
                    className="h-4 w-4 rounded border-gray-300 text-slate-900"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {student.parent_phone || "No phone"}
                    </p>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">
            {selectedIds.length} selected
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || isPending}
              onClick={handleAssign}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending ? "Assigning..." : "Add to Batch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
