import axios from "axios"

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "https://juris-saas.onrender.com/api",
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

let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error)
    else       p.resolve(token)
  })
  failedQueue = []
}

API.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/refresh-token")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization =
            `Bearer ${token}`
          return API(original)
        }).catch(err => Promise.reject(err))
      }

      original._retry = true
      isRefreshing     = true

      const refreshToken =
        localStorage.getItem("refreshToken")

      if (!refreshToken) {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("role")
        window.location.href = "/"
        return Promise.reject(error)
      }

      try {
        const { data } = await API.post(
          "/auth/refresh-token",
          { refreshToken }
        )
        localStorage.setItem(
          "token", data.token
        )
        localStorage.setItem(
          "refreshToken", data.refreshToken
        )
        original.headers.Authorization =
          `Bearer ${data.token}`
        processQueue(null, data.token)
        return API(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("role")
        window.location.href = "/"
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default API
