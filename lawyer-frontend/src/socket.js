import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace("/api", "") 
  : "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ["polling", "websocket"],
  withCredentials: true,
  reconnection: true
});

socket.on("connect", () => console.log("✅ Lawyer Console: Link Active"));
socket.on("connect_error", (err) => console.error("❌ Lawyer Link Failure:", err.message));

export default socket;