import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://hotelpass-api-gtml.onrender.com";

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { API_BASE_URL };