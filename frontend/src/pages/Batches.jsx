import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBatches, useDeleteBatch } from "../hooks/useBatches";
import { useClasses } from "../hooks/useCurriculum";
import BatchCard from "../components/batch/BatchCard";
import CreateBatchModal from "../components/batch/CreateBatchModal";

export default function Batches() {
  const navigate = useNavigate();
  const { data: batches = [], isLoading, error } = useBatches();
  const { data: classes = [] } = useClasses();
  const { mutateAsync: removeBatch } = useDeleteBatch();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const classMap = useMemo(
    () => Object.fromEntries(classes.map((c) => [c.id, c.name])),
    [classes],
  );

  const handleDelete = async (batch) => {
    if (
      window.confirm(
        `Delete batch "${batch.name}"? Students themselves will not be deleted.`,
      )
    ) {
      await removeBatch(batch.id);
    }
  };

  if (isLoading)
    return <div className="p-8 text-gray-500">Loading batches...</div>;
  if (error)
    return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Batches</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage time slots, attendance groups, and scheduled tests
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
        >
          + Create Batch
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-gray-500 shadow-sm">
          No batches yet. Create your first time slot (e.g., 4:00 PM – 5:00 PM)
          to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              className={classMap[batch.class_id]}
              onOpen={() => navigate(`/batches/${batch.id}`)}
              onDeleteClick={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateBatchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
