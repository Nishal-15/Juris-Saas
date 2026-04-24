import axios from "axios";

// ✅ CREATE AXIOS INSTANCE
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

// ✅ SET TOKEN FUNCTION
export const setAuthToken = (token) => {
  if (token) {
    instance.defaults.headers.common["x-auth-token"] = token;
  } else {
    delete instance.defaults.headers.common["x-auth-token"];
  }
};

// ✅ RESPONSE INTERCEPTOR (Handle Expired Tokens)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expired. Redirecting to login...");
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// ✅ EXPORT BOTH
export default instance;