import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace("/api", "") 
  : (import.meta.env.VITE_API_BASE ? import.meta.env.VITE_API_BASE.replace("/api", "") : "https://juris-saas.onrender.com");

const socket = io(SOCKET_URL, {
  transports: ["websocket"], // Forced websocket for stable Cloudflare/Render connection
  withCredentials: true,
  reconnection: true,
  auth: (cb) => {
    cb({ token: localStorage.getItem("token") });
  }
});

socket.on("connect", () => console.log("✅ Lawyer Console: Link Active"));
socket.on("connect_error", (err) => console.error("❌ Lawyer Link Failure:", err.message));

export default socket;