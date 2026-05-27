import { createContext, useState, useRef, useEffect, useContext } from "react";
import Peer from "peerjs";
import { useSelector } from "react-redux";

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const user = useSelector((state) => state.auth.user);

    const [call, setCall] = useState({
        isReceivingCall: false,
        from: null,
        type: null,
        active: false,
        peerId: null,
        stream: null
    });

    const myVideo = useRef();
    const userVideo = useRef();

    const connectionRef = useRef();
    const peerRef = useRef();

    useEffect(() => {
        if (!user?._id) return;
        const serverUrl = new URL(import.meta.env.VITE_SERVER_URL || "http://localhost:5000");
        peerRef.current = new Peer(user._id, {
            host: serverUrl.hostname,
            port: serverUrl.port || (serverUrl.protocol === "https:" ? 443 : 80),
            secure: serverUrl.protocol === "https:",
            path: "/peerjs"
        });

        peerRef.current.on("open", (id) => {
            console.log("Peer connected:", id);
        });

        return () => {
            peerRef.current?.destroy();
        };

    }, [user]);

    return (
        <CallContext.Provider
            value={{
                call,
                setCall,
                myVideo,
                userVideo,
                connectionRef,
                peerRef
            }}
        >
            {children}
        </CallContext.Provider>
    );
};