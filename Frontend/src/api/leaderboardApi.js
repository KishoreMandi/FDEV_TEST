import axios from "./axiosInstance";

export const getLeaderboard = (examId) =>
  axios.get(`/leaderboard/live/${examId}`);
