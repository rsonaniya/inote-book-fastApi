import axios from "axios";

// Create a custom Axios instance
const api = axios.create({
  baseURL: "/", // Replace with your actual API URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach the token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Catch 401 Unauthorized errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // The token is invalid or expired.
      console.error("Authentication error, logging out...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
