import axios from "./axiosInstance";

export const autoSave = (data) =>
  axios.patch("/results/autosave", data);

export const resumeExam = (examId) =>
  axios.get(`/results/resume/${examId}`);

export const submitExam = (data) =>
  axios.post("/results/submit", data);

export const getAnalytics = (examId) =>
  axios.get(`/analytics/${examId}`);

export const getStudentExamStatus = () =>
  axios.get("/results/student/status");
