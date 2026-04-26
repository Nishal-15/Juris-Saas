import { io } from "socket.io-client";

const socket = io("https://armed-wavy-carwash.ngrok-free.dev", {
  transports: ["polling", "websocket"],
  withCredentials: true,
  reconnection: true
});

socket.on("connect", () => console.log("✅ Lawyer Console: Link Active"));
socket.on("connect_error", (err) => console.error("❌ Lawyer Link Failure:", err.message));

export default socket;