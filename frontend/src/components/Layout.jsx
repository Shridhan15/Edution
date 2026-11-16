// frontend/src/components/Layout.jsx
import { Outlet, Link } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h2 className="text-xl font-bold mb-8">EduNova AI</h2>
        <nav className="flex flex-col space-y-4">
          <Link to="/" className="hover:text-blue-400 transition-colors">
            Dashboard
          </Link>
          <Link
            to="/students"
            className="hover:text-blue-400 transition-colors"
          >
            Students
          </Link>
          <Link
            to="/curriculum"
            className="hover:text-blue-400 transition-colors"
          >
            Curriculum
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet /> {/* Child pages will render here */}
      </main>
    </div>
  );
}
