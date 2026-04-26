import { io } from "socket.io-client";

const isLocal = window.location.hostname.includes("localhost") || 
                  window.location.hostname.includes("127.0.0.1") || 
                  window.location.hostname.startsWith("192.168.");
const SOCKET_URL = isLocal 
  ? "http://localhost:5000" 
  : "https://armed-wavy-carwash.ngrok-free.dev";

const socket = io(SOCKET_URL, {
  transports: ["polling", "websocket"],
  withCredentials: true,
  reconnection: true
});

socket.on("connect", () => console.log("✅ Lawyer Console: Link Active"));
socket.on("connect_error", (err) => console.error("❌ Lawyer Link Failure:", err.message));

export default socket;