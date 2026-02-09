import axios from "./axiosInstance";

export const getDepartments = () => axios.get("/departments");

export const addDepartment = (data) => axios.post("/departments", data);

export const deleteDepartment = (id) => axios.delete(`/departments/${id}`);

