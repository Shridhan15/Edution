import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import StudentProfile from "./pages/StudentProfile";
import Dashboard from "./pages/Dashboard";
import StudentList from "./pages/StudentList";
import Curriculum from "./pages/Curriculum";
import ClassDetails from "./pages/ClassDetails";
import Batches from "./pages/Batches";
import BatchDetails from "./pages/BatchDetails";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="students/:studentId" element={<StudentProfile />} />
          <Route path="batches" element={<Batches />} />
          <Route path="batches/:batchId" element={<BatchDetails />} />
          {/* Dynamic route for the class drill-down */}
          <Route path="curriculum/:classId" element={<ClassDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
