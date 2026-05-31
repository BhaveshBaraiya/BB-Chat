import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

export const SocketContext = createContext();

export default function SocketProvider({ children }) {
    const user = useSelector((state) => state.auth.user);
    const userId = user?._id;
    
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [lastSeenMap, setLastSeenMap] = useState({});

    useEffect(() => {
        if (!userId) return;
        
        const socketInstance = io(import.meta.env.VITE_SERVER_URL || "http://localhost:5000", {
            query: { userId },
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

        socketInstance.on("userWentOffline", ({ userId, lastSeen }) => {
            setLastSeenMap(prev => ({ ...prev, [userId]: lastSeen }));
            setOnlineUsers(prev => prev.filter(id => id !== userId));
        });

        socketInstance.on("userCameOnline", ({ userId: onlineId }) => {
            setOnlineUsers(prev => {
                if (!prev.includes(onlineId)) return [...prev, onlineId];
                return prev;
            });
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
    }, [userId]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers, lastSeenMap }}>
            {children}
        </SocketContext.Provider>
    );
}