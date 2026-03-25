import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  throw new Error("VITE_API_URL no está definida");
}

const api = axios.create({
  baseURL,
  headers: { 
    "Content-Type": "application/json",
    "Accept-Language": "es" 
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kore_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      localStorage.removeItem("kore_token");
      localStorage.removeItem("kore_user");
      window.dispatchEvent(new CustomEvent("kore:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default api;
