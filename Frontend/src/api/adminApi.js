import axios from "./axiosInstance";

export const getAdminStats = () =>
  axios.get("/admin/stats");