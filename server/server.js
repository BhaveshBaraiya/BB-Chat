import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";
import { ExpressPeerServer } from 'peer';

dotenv.config();

// DB + Routes
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { initializeSocket } from "./socket/socket.js";

// Connect DB
connectDB();

const app = express();

/* ========================
MIDDLEWARE
======================== */
const allowedOrigins = process.env.CLIENT_URL 
    ? process.env.CLIENT_URL.split(',') 
    : ["http://localhost:5173"];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

/* ========================
   HEALTH CHECK
======================== */

app.get("/", (req, res) => {
    res.send("Chat API Running 🚀");
});

/* ========================
   ROUTES
======================== */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

/* ========================
   SOCKET.IO SERVER
======================== */

const server = http.createServer(app);
initializeSocket(server);

/* ========================
   PEERJS SERVER
======================== */
const peerApp = express();
peerApp.use(cors(corsOptions)); 

const peerHttpServer = http.createServer(peerApp);
const peerServer = ExpressPeerServer(peerHttpServer, {
    debug: true,
    path: '/stream',
});

peerApp.use('/peerjs', peerServer);

const PEER_PORT = process.env.PEER_PORT || 5001;
peerHttpServer.listen(PEER_PORT, () => {
    console.log(`📡 PeerJS server running on port ${PEER_PORT}`);
});

/* ========================
   START MAIN SERVER
======================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});