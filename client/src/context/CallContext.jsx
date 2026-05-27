import { createContext, useState, useRef, useEffect, useContext } from "react";
import Peer from "peerjs";
import { AuthContext } from "./AuthContext";

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const { user } = useContext(AuthContext);

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

        peerRef.current = new Peer(user._id, {
            host: import.meta.env.VITE_SERVER_URL.replace(
                "https://",
                ""
            ),
            secure: true,
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