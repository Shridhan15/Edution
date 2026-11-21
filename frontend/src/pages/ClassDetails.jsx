import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useClasses,
  useSubjects,
  useCreateSubject,
  useChapters,
  useCreateChapter,
} from "../hooks/useCurriculum";

function SubjectCard({ subject }) {
  const { data: chapters = [], isLoading } = useChapters(subject.id);
  const { mutateAsync: addChapter, isPending } = useCreateChapter(subject.id);

  const [newChapterName, setNewChapterName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">{subject.name}</h3>
        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
          {chapters.length} Chapters
        </span>
      </div>

      <div className="p-4 space-y-2">
        {isLoading && (
          <p className="text-sm text-gray-400 text-center py-2">
            Loading chapters...
          </p>
        )}
        {!isLoading && chapters.length === 0 && !isAdding && (
          <p className="text-sm text-gray-400 text-center py-2">
            No chapters yet.
          </p>
        )}

        {chapters.map((chap) => (
          <div
            key={chap.id}
            className="group flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-mono text-sm">
                {chap.chapter_number}.
              </span>
              <span className="text-gray-700 font-medium text-sm">
                {chap.name}
              </span>
            </div>

            <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
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
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              Add Material
            </button>
          </div>
        ))}

        {isAdding ? (
          <form onSubmit={handleAddChapter} className="flex gap-2 mt-2">
            <input
              type="text"
              autoFocus
              placeholder="Chapter name..."
              className="flex-1 text-sm rounded-lg border border-gray-300 p-2 outline-none focus:border-slate-900"
              value={newChapterName}
              onChange={(e) => setNewChapterName(e.target.value)}
            />
            <button
              type="submit"
              disabled={isPending}
              className="bg-slate-900 text-white px-3 py-2 text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending ? "..." : "Save"}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-gray-500 hover:text-slate-900 mt-2 flex items-center gap-1"
          >
            + Add Chapter
          </button>
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
    <div className="p-8">
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
            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isAddingSubject ? "Cancel" : "+ Add Subject"}
          </button>
        </div>
      </div>

      {isAddingSubject && (
        <form
          onSubmit={handleAddSubject}
          className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4"
        >
          <input
            type="text"
            autoFocus
            placeholder="e.g. Mathematics, Science..."
            className="flex-1 rounded-lg border border-gray-300 p-2 outline-none focus:border-slate-900"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Subject"}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-gray-500">Loading subjects...</div>
      ) : subjects.length === 0 && !isAddingSubject ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-100">
          No subjects found for this class. Click "+ Add Subject" to start.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <SubjectCard key={sub.id} subject={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
