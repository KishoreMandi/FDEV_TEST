import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import AdminDashboard from "../pages/admin/Dashboard";
import CreateExam from "../pages/admin/CreateExam";
import AddQuestions from "../pages/admin/AddQuestions";
import Results from "../pages/admin/Results";

import StudentDashboard from "../pages/student/StudentDashboard";
import Exam from "../pages/student/Exam";
import Result from "../pages/student/Result";
import StudentLeaderboard from "../pages/student/Leaderboard";
import ManageExams from "../pages/admin/ManageExams";
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
          <ProtectedRoute role={["admin", "trainer"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/create-exam"
        element={
          <ProtectedRoute role={["admin", "trainer"]}>
            <CreateExam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/add-questions"
        element={
          <ProtectedRoute role={["admin", "trainer"]}>
            <AddQuestions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/results"
        element={
          <ProtectedRoute role={["admin", "trainer"]}>
            <Results />
          </ProtectedRoute>
        }
      />

      <Route
  path="/admin/manage-exams"
  element={
    <ProtectedRoute role={["admin", "trainer"]}>
      <ManageExams />
    </ProtectedRoute>
  }
/>

    </Routes>
  );
};

export default AppRoutes;
