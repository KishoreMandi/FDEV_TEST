import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import AdminDashboard from "../pages/admin/Dashboard";
import TrainerDashboard from "../pages/trainer/TrainerDashboard";
import CreateExam from "../pages/admin/CreateExam";
import TrainerCreateExam from "../pages/trainer/CreateExam";
import AddQuestions from "../pages/admin/AddQuestions";
import TrainerAddQuestions from "../pages/trainer/AddQuestions";
import Results from "../pages/admin/Results";
import TrainerResults from "../pages/trainer/Results";

import StudentDashboard from "../pages/student/StudentDashboard";
import Exam from "../pages/student/Exam";
import Result from "../pages/student/Result";
import StudentLeaderboard from "../pages/student/Leaderboard";
import ManageExams from "../pages/admin/ManageExams";
import TrainerManageExams from "../pages/trainer/ManageExams";
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
        path="/trainer/dashboard"
        element={
          <ProtectedRoute role="trainer">
            <TrainerDashboard />
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
        path="/trainer/create-exam"
        element={
          <ProtectedRoute role="trainer">
            <TrainerCreateExam />
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
        path="/trainer/add-questions"
        element={
          <ProtectedRoute role="trainer">
            <TrainerAddQuestions />
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
        path="/trainer/results"
        element={
          <ProtectedRoute role="trainer">
            <TrainerResults />
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
        path="/trainer/manage-exams"
        element={
          <ProtectedRoute role="trainer">
            <TrainerManageExams />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
};

export default AppRoutes;
