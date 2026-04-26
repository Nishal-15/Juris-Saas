import { io } from "socket.io-client";

// ✅ USE THE NGROK URL OR ENV FOR PRODUCTION
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://armed-wavy-carwash.ngrok-free.dev";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  secure: true,
  reconnection: true
});

// ✅ AUDIO PRIMER: Bypasses Mobile Browser Auto-play Policy
export const primeAudio = () => {
  const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
  silentAudio.play().catch(() => {});
};

export default socket;
