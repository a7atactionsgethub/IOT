import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login if token expired
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post("/auth/login", data).then(r => r.data);

// Patients
export const getPatients = () => api.get("/patients").then(r => r.data);
export const getPatient = (id) => api.get(`/patients/${id}`).then(r => r.data);
export const createPatient = (data) => api.post("/patients", data).then(r => r.data);
export const deletePatient = (id) => api.delete(`/patients/${id}`).then(r => r.data);

// Readings
export const getReadings = (params) => api.get("/readings", { params }).then(r => r.data);
export const getLatestReadings = () => api.get("/readings/latest").then(r => r.data);
export const postReading = (data) => api.post("/readings", data).then(r => r.data);

// Alerts
export const getAlerts = (params) => api.get("/alerts", { params }).then(r => r.data);
export const getAlertCount = () => api.get("/alerts/count").then(r => r.data);
