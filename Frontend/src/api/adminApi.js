import axios from "./axiosInstance";

export const getAdminStats = () =>
  axios.get("/admin/stats");

export const getUsers = () =>
  axios.get("/admin/users");

export const approveUser = (userId) =>
  axios.put("/admin/approve-user", { userId });

export const updateUserStatus = (userId, status) =>
  axios.put("/admin/users/status", { userId, status });

export const updateUserRole = (userId, role) =>
  axios.put("/admin/users/role", { userId, role });

export const updateUserDepartment = (userId, department) =>
  axios.put("/admin/users/department", { userId, department });
