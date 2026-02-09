import axios from "./axiosInstance";

export const getDepartments = () => axios.get("/departments");

export const addDepartment = (data) => axios.post("/departments", data);

export const updateDepartment = (id, data) => axios.put(`/departments/${id}`, data);

export const deleteDepartment = (id) => axios.delete(`/departments/${id}`);

