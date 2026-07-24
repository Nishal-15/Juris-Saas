import axios from "axios"

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE ||
    "http://localhost:5000/api",
  timeout: 15000,
})

API.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem("token")
    if (token) {
      try {
        const payload = JSON.parse(
          atob(token.split(".")[1])
        )
        const now = Math.floor(
          Date.now() / 1000
        )
        if (
          payload.exp &&
          payload.exp < now
        ) {
          localStorage.removeItem("token")
          localStorage.removeItem("role")
          window.location.href = "/"
          return Promise.reject(
            new Error("Token expired")
          )
        }
      } catch {}
      config.headers.Authorization =
        `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("role")
      window.location.href = "/"
    }
    return Promise.reject(error)
  }
)

export default API
