import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import AdminDashboard from "../pages/admin/Dashboard";
import CreateExam from "../pages/admin/CreateExam";
import AddQuestions from "../pages/admin/AddQuestions";
import Results from "../pages/admin/Results";
import ResultAnalysis from "../pages/admin/ResultAnalysis";
import Reports from "../pages/admin/Reports";

import StudentDashboard from "../pages/student/StudentDashboard";
import Exam from "../pages/student/Exam";
import Result from "../pages/student/Result";
import StudentLeaderboard from "../pages/student/Leaderboard";
import ManageExams from "../pages/admin/ManageExams";
import ManageDepartments from "../pages/admin/ManageDepartments";
import EditExam from "../pages/admin/EditExam";
import ProtectedRoute from "./ProtectedRoute";
import { UIProvider } from "../context/UIContext";
import AdminLayout from "../components/AdminLayout";

const AppRoutes = () => {
  return (
    <Routes>
      {/* AUTH */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* STUDENT */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role={["student", "employee"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/exam/:examId"
        element={
          <ProtectedRoute role={["student", "employee"]}>
            <Exam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/result/:examId"
        element={
          <ProtectedRoute role={["student", "employee"]}>
            <Result />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/leaderboard/:examId"
        element={
          <ProtectedRoute role={["student", "employee"]}>
            <StudentLeaderboard />
          </ProtectedRoute>
        }
      />

      {/* ADMIN */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <UIProvider>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="departments" element={<ManageDepartments />} />
                  <Route path="create-exam" element={<CreateExam />} />
                  <Route path="add-questions" element={<AddQuestions />} />
                  <Route path="results" element={<Results />} />
                  <Route path="result-analysis/:resultId" element={<ResultAnalysis />} />
                  <Route path="manage-exams" element={<ManageExams />} />
                  <Route path="edit-exam/:id" element={<EditExam />} />
                </Routes>
              </AdminLayout>
            </UIProvider>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<div className="p-10 text-center text-red-500 font-bold">404 - Page Not Found (Debug: {window.location.pathname})</div>} />

    </Routes>
  );
};

export default AppRoutes;
