import { useState } from "react";
import { useUploadMaterial } from "../../hooks/useMaterials";

export default function UploadMaterialModal({
  isOpen,
  onClose,
  chapterId,
  chapterName,
}) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState("");

  const {
    mutateAsync: upload,
    isPending,
    error,
  } = useUploadMaterial(chapterId);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setLocalError("");
    if (!selected) return;

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setLocalError("Please select a valid PDF file.");
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setLocalError("File size must be under 20 MB.");
      return;
    }

    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.pdf$/i, ""));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setLocalError("Please choose a PDF file to upload.");
      return;
    }

    await upload({ file, title });
    setTitle("");
    setFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Upload Chapter PDF
            </h3>
            {chapterName && (
              <p className="text-xs text-gray-500">Chapter: {chapterName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {(localError || error) && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {localError || error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Material Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., NCERT Chapter 12 - Ecosystem"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              PDF File (Max 20 MB)
            </label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="block w-full rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !file}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending ? "Uploading..." : "Upload & Index"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
