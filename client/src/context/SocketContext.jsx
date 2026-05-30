import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

export const SocketContext = createContext();

export default function SocketProvider({ children }) {
    const user = useSelector((state) => state.auth.user);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!user) return;
        const socketInstance = io(import.meta.env.VITE_SERVER_URL || "http://localhost:5000", {
            query: { userId: user._id },
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        setSocket(socketInstance);

        socketInstance.on("onlineUsers", (users) => {
            setOnlineUsers(users);
        });

        socketInstance.on("disconnect", (reason) => {
            console.log("🔴 SOCKET DISCONNECTED:", reason);
            if (reason === "io server disconnect" || reason === "transport close" || reason === "ping timeout") {
                socketInstance.connect();
            }
        });

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                if (!socketInstance.connected) {
                    socketInstance.connect();
                } else {
                    socketInstance.emit("ping_check"); 
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            socketInstance.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
}