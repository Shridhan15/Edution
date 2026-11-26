import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useClasses,
  useSubjects,
  useCreateSubject,
  useChapters,
  useCreateChapter,
} from "../hooks/useCurriculum";
import ChapterMaterials from "../components/curriculum/ChapterMaterials";

function SubjectRow({ subject }) {
  const { data: chapters = [], isLoading } = useChapters(subject.id);
  const { mutateAsync: addChapter, isPending } = useCreateChapter(subject.id);

  const [newChapterName, setNewChapterName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [expandedChapterId, setExpandedChapterId] = useState(null);

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapterName.trim()) return;

    await addChapter({
      name: newChapterName,
      subject_id: subject.id,
      chapter_number: chapters.length + 1,
    });
    setNewChapterName("");
    setIsAdding(false);
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapterId((prev) => (prev === chapterId ? null : chapterId));
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      {/* Subject Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">{subject.name}</h3>
          <span className="rounded-full bg-gray-200/80 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {chapters.length} {chapters.length === 1 ? "Chapter" : "Chapters"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {isAdding ? "Cancel" : "+ Add Chapter"}
        </button>
      </div>

      {/* Inline Add Chapter Form */}
      {isAdding && (
        <form
          onSubmit={handleAddChapter}
          className="flex items-center gap-3 border-b border-gray-100 bg-blue-50/30 px-6 py-3"
        >
          <input
            type="text"
            autoFocus
            placeholder="Enter chapter name..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
            value={newChapterName}
            onChange={(e) => setNewChapterName(e.target.value)}
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Chapter"}
          </button>
        </form>
      )}

      {/* Chapters List */}
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <p className="px-6 py-6 text-sm text-gray-400">Loading chapters...</p>
        ) : chapters.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">
            No chapters yet. Click "+ Add Chapter" to get started.
          </p>
        ) : (
          chapters.map((chap) => {
            const isExpanded = expandedChapterId === chap.id;

            return (
              <div key={chap.id} className={isExpanded ? "bg-gray-50/40" : ""}>
                <div
                  onClick={() => toggleChapter(chap.id)}
                  className="group flex cursor-pointer items-center justify-between px-6 py-4 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 font-mono text-xs font-semibold text-gray-500">
                      {chap.chapter_number}
                    </span>
                    <span className="truncate text-sm font-semibold text-gray-800">
                      {chap.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChapter(chap.id);
                    }}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isExpanded
                        ? "bg-slate-900 text-white"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    {isExpanded ? "Hide Materials" : "Materials"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-5">
                    <ChapterMaterials
                      chapterId={chap.id}
                      chapterName={chap.name}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ClassDetails() {
  const { classId } = useParams();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [], isLoading } = useSubjects(classId);
  const { mutateAsync: addSubject, isPending } = useCreateSubject(classId);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const currentClass = classes.find((c) => c.id === classId);
  const className = currentClass ? currentClass.name : "Class Details";

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    await addSubject({ name: newSubjectName, class_id: classId });
    setNewSubjectName("");
    setIsAddingSubject(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <Link
          to="/curriculum"
          className="text-sm text-blue-500 hover:underline flex items-center gap-1 mb-2"
        >
          &larr; Back to Curriculum
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">{className}</h1>
          <button
            onClick={() => setIsAddingSubject(!isAddingSubject)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            {isAddingSubject ? "Cancel" : "+ Add Subject"}
          </button>
        </div>
      </div>

      {isAddingSubject && (
        <form
          onSubmit={handleAddSubject}
          className="mb-6 bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex gap-4"
        >
          <input
            type="text"
            autoFocus
            placeholder="e.g. Mathematics, Science..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Subject"}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-gray-500">Loading subjects...</div>
      ) : subjects.length === 0 && !isAddingSubject ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-xl border border-gray-200">
          No subjects found for this class. Click "+ Add Subject" to start.
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.map((sub) => (
            <SubjectRow key={sub.id} subject={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
