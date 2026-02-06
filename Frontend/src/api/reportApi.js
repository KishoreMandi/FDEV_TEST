import axios from "./axiosInstance";

export const getReports = () => axios.get("/reports");
