import axios from "./axiosInstance";

export const getExams = () => axios.get("/exams");

export const getExamById = (examId) => axios.get(`/exams/${examId}`);

export const getQuestions = (examId) =>
  axios.get(`/questions/${examId}`);

export const getAdminQuestions = (examId) =>
  axios.get(`/questions/admin/${examId}`);

export const updateQuestion = (questionId, data) =>
  axios.put(`/questions/${questionId}`, data);

export const deleteQuestion = (questionId) =>
  axios.delete(`/questions/${questionId}`);

export const updateExam = (examId, data) =>
  axios.put(`/exams/${examId}`, data);

export const deleteExam = (examId) =>
  axios.delete(`/exams/${examId}`);

