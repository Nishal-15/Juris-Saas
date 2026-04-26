import { io } from "socket.io-client";

const socket = io("https://armed-wavy-carwash.ngrok-free.dev");

export default socket;