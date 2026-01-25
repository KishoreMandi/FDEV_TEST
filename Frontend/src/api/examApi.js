import axios from "./axiosInstance";

export const getExams = () => axios.get("/exams");

export const getQuestions = (examId) =>
  axios.get(`/questions/${examId}`);

export const updateExam = (examId, data) =>
  axios.put(`/exams/${examId}`, data);

export const deleteExam = (examId) =>
  axios.delete(`/exams/${examId}`);

