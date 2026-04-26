import { io } from "socket.io-client";

// ✅ USE THE NGROK URL FOR CROSS-DEVICE TESTING (Laptops <-> Mobiles)
const SOCKET_URL = "https://armed-wavy-carwash.ngrok-free.dev";

const socket = io(SOCKET_URL, {
  transports: ["polling", "websocket"], // Polling first is more stable for ngrok
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10
});

socket.on("connect", () => console.log("✅ JurisBot Communication Link Active"));
socket.on("connect_error", (err) => console.error("❌ Communication Link Failure:", err.message));

// ✅ AUDIO PRIMER: Bypasses Mobile Browser Auto-play Policy
export const primeAudio = () => {
  const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
  silentAudio.play().catch(() => {});
};

export default socket;
