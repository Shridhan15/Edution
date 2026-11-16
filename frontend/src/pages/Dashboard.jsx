// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(`${data.status} | ${data.database}`))
      .catch(() => setStatus("Backend offline"));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Teacher Dashboard
      </h1>
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2">
          <span
            className={`flex h-3 w-3 rounded-full ${status.includes("offline") ? "bg-red-500" : "bg-green-500"}`}
          ></span>
          <p className="text-gray-600 font-medium text-sm">{status}</p>
        </div>
      </div>
    </div>
  );
}
