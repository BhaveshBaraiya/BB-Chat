import { createContext, useState, useRef, useEffect } from "react";
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
        const isLocalhost = serverUrl.hostname === 'localhost' || serverUrl.hostname === '127.0.0.1';
        const peerPort = import.meta.env.VITE_PEER_PORT || (isLocalhost ? 5001 : (serverUrl.protocol === "https:" ? 443 : 80));

        peerRef.current = new Peer(user._id, {
            host: serverUrl.hostname,
            port: Number(peerPort), 
            secure: serverUrl.protocol === "https:",
            path: "/peerjs/stream"
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