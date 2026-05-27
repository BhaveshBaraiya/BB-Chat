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
            transports: ["polling"],
            withCredentials: true
        });

        setSocket(socketInstance);

        socketInstance.on("connect", () => {
            console.log("🟢 SOCKET CONNECTED:", socketInstance.id);
        });

        socketInstance.on("onlineUsers", setOnlineUsers);

        return () => socketInstance.disconnect();
    }, [user]);

    return (
        <SocketContext.Provider value={{
            socket,
            onlineUsers
        }}>
            {children}
        </SocketContext.Provider>
    );
}