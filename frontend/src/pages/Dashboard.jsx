import { useState, useMemo } from "react";
import { useStudents } from "../hooks/useStudents";
import { useClasses } from "../hooks/useCurriculum";
import { useBatches } from "../hooks/useBatches";
import AddStudentModal from "../components/AddStudentModal";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatsGrid from "../components/dashboard/StatsGrid";
import ClassesOverviewCard from "../components/dashboard/ClassesOverviewCard";
import RecentStudentsCard from "../components/dashboard/RecentStudentsCard";

export default function Dashboard() {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  const {
    data: students = [],
    isLoading: studentsLoading,
    error: studentsError,
  } = useStudents();

  const {
    data: classes = [],
    isLoading: classesLoading,
    error: classesError,
  } = useClasses();

  const {
    data: batches = [],
    isLoading: batchesLoading,
    error: batchesError,
  } = useBatches();

  const classMap = useMemo(
    () => Object.fromEntries(classes.map((cls) => [cls.id, cls.name])),
    [classes],
  );

  const stats = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "ACTIVE").length;
    const totalSubjects = classes.reduce(
      (sum, cls) => sum + (cls.subject_count || 0),
      0,
    );
    return {
      totalStudents: students.length,
      activeStudents,
      totalClasses: classes.length,
      totalSubjects,
      totalBatches: batches.length,
    };
  }, [students, classes, batches]);

  const recentStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => new Date(b.joining_date) - new Date(a.joining_date))
      .slice(0, 5);
  }, [students]);

  if (studentsLoading || classesLoading || batchesLoading) {
    return <div className="p-8 text-gray-500">Loading dashboard...</div>;
  }

  if (studentsError || classesError || batchesError) {
    return (
      <div className="p-8 text-red-500">
        Error loading dashboard:{" "}
        {(studentsError || classesError || batchesError).message}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <DashboardHeader onAddStudentClick={() => setIsAddStudentOpen(true)} />

      <StatsGrid {...stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ClassesOverviewCard classes={classes} />
        </div>
        <div className="lg:col-span-1">
          <RecentStudentsCard students={recentStudents} classMap={classMap} />
        </div>
      </div>

      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
      />
    </div>
  );
}
