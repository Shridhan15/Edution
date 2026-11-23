import { useState } from "react";
import { useCreateBatch } from "../../hooks/useBatches";
import { useClasses } from "../../hooks/useCurriculum";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CreateBatchModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    class_id: "",
    start_time: "16:00",
    end_time: "17:00",
    days_of_week: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  });

  const { data: classes = [] } = useClasses();
  const { mutateAsync: createBatch, isPending, error } = useCreateBatch();

  if (!isOpen) return null;

  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBatch({
        ...formData,
        class_id: formData.class_id || null,
      });
      setFormData({
        name: "",
        class_id: "",
        start_time: "16:00",
        end_time: "17:00",
        days_of_week: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      });
      onClose();
    } catch {
      // Handled by TanStack Query error state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Create New Batch</h2>
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
              Batch Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Class 10 Evening, 4-5 PM Math"
              className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Class (Optional)
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={formData.class_id}
              onChange={(e) =>
                setFormData({ ...formData, class_id: e.target.value })
              }
            >
              <option value="">Mixed / All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                required
                className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-blue-500"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                type="time"
                required
                className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-blue-500"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Days of Week
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const active = formData.days_of_week.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
              {isPending ? "Creating..." : "Create Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
