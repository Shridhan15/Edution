import { useState } from "react";
import { useCreateStudent } from "../hooks/useStudents";

export default function AddStudentModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    full_name: "",
    parent_name: "",
    parent_phone: "",
  });

  const { mutateAsync: addStudent, isPending, error } = useCreateStudent();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addStudent(formData);
      setFormData({ full_name: "", parent_name: "", parent_phone: "" });
      onClose();
    } catch {
      // Error is handled by TanStack Query's `error` state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Add New Student</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
            {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Student Name
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Parent Name
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={formData.parent_name}
              onChange={(e) =>
                setFormData({ ...formData, parent_name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Parent Phone
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={formData.parent_phone}
              onChange={(e) =>
                setFormData({ ...formData, parent_phone: e.target.value })
              }
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
