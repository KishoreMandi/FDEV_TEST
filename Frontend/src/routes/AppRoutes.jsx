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
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/exam/:examId"
        element={
          <ProtectedRoute role="student">
            <Exam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/result/:examId"
        element={
          <ProtectedRoute role="student">
            <Result />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/leaderboard/:examId"
        element={
          <ProtectedRoute role="student">
            <StudentLeaderboard />
          </ProtectedRoute>
        }
      />

      {/* ADMIN */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute role="admin">
            <ManageDepartments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/create-exam"
        element={
          <ProtectedRoute role="admin">
            <CreateExam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/add-questions"
        element={
          <ProtectedRoute role="admin">
            <AddQuestions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/results"
        element={
          <ProtectedRoute role="admin">
            <Results />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/result-analysis/:resultId"
        element={
          <ProtectedRoute role="admin">
            <ResultAnalysis />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/manage-exams"
        element={
          <ProtectedRoute role="admin">
            <ManageExams />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/edit-exam/:id"
        element={
          <ProtectedRoute role="admin">
            <EditExam />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<div className="p-10 text-center text-red-500 font-bold">404 - Page Not Found (Debug: {window.location.pathname})</div>} />

    </Routes>
  );
};

export default AppRoutes;
