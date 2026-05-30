import { createContext, useState, useRef, useEffect, useContext } from "react";
import Peer from "peerjs";
import { useSelector, useDispatch } from "react-redux";
import { SocketContext } from "./SocketContext";
import { setCallState } from "../redux/features/callSlice";
import toast from "react-hot-toast";

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const { socket } = useContext(SocketContext);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [isCallConnected, setIsCallConnected] = useState(false);
    const [callStatus, setCallStatus] = useState("idle"); 

    const myVideo = useRef(null);
    const userVideo = useRef(null);
    const peerRef = useRef(null);
    const activeCallRef = useRef(null);
    const incomingCallRef = useRef(null);
    const timerIntervalRef = useRef(null);
    
    // Permanent Audio Refs
    const ringtoneRef = useRef(null);
    const ringbackRef = useRef(null);

    useEffect(() => {
        if (!user?._id) return;
    
        const serverUrl = new URL(import.meta.env.VITE_SERVER_URL || "http://localhost:5000");
        const isLocalhost = serverUrl.hostname === 'localhost' || serverUrl.hostname === '127.0.0.1';
        const peerPort = import.meta.env.VITE_PEER_PORT || (isLocalhost ? 5001 : (serverUrl.protocol === "https:" ? 443 : 80));

        peerRef.current = new Peer(user._id, {
            host: serverUrl.hostname,
            port: Number(peerPort), 
            secure: serverUrl.protocol === "https:",
            path: "/peerjs/stream",
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peerRef.current.on('call', (incomingPeerCall) => {
            incomingCallRef.current = incomingPeerCall;
        });

        return () => {
            peerRef.current?.destroy();
            clearInterval(timerIntervalRef.current);
            stopSounds();
        };
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        const handleIncoming = (data) => {
            setCallStatus("ringing");
            
            // Play incoming ringtone immediately
            if (ringtoneRef.current) {
                ringtoneRef.current.play().catch(e => console.warn("Ringtone blocked:", e));
            }
            
            dispatch(setCallState({
                active: true,
                isReceivingCall: true,
                from: data.from,
                type: data.type,
                remoteName: data.callerName,
                remotePic: data.callerPic
            }));
        };

        const handleCallAccepted = () => {
            stopSounds();
            setIsCallConnected(true);
            setCallStatus("connected");
            startTimer();
        };

        const handleCallEnded = () => {
            resetCall();
            toast("Call Ended", { icon: "📞" });
        };

        socket.on("call:incoming", handleIncoming);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("call:ended", handleCallEnded);

        return () => {
            socket.off("call:incoming", handleIncoming);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("call:ended", handleCallEnded);
        };
    }, [socket, dispatch]);

    const stopSounds = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
        if (ringbackRef.current) {
            ringbackRef.current.pause();
            ringbackRef.current.currentTime = 0;
        }
    };

    const startTimer = () => {
        clearInterval(timerIntervalRef.current);
        setCallDuration(0);
        timerIntervalRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);
    };

    const stopAllTracks = (stream) => {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
        }
    };

    const getMediaConstraints = (type) => ({
        video: type === "video" ? { facingMode: "user" } : false,
        audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true 
        }
    });

    // 3. Initiate Call
    const initiateCall = async (receiverId, receiverName, receiverPic, type) => {
        // 🔥 CRITICAL FIX: Play sound SYNCHRONOUSLY before any await calls 🔥
        if (ringbackRef.current) {
            ringbackRef.current.play().catch(e => console.warn("Ringback blocked:", e));
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints(type));
            
            setLocalStream(stream);
            setCallStatus("calling");

            dispatch(setCallState({ 
                active: true, 
                type, 
                from: receiverId, 
                remoteName: receiverName, 
                remotePic: receiverPic,
                isReceivingCall: false 
            }));

            if (peerRef.current) {
                const call = peerRef.current.call(receiverId, stream);
                activeCallRef.current = call;

                call.on("stream", (incomingRemoteStream) => {
                    setRemoteStream(incomingRemoteStream);
                });
            }

            socket.emit("call:initiate", { 
                to: receiverId, 
                type, 
                peerId: user._id, 
                callerName: user.fullName, 
                callerPic: user.profilePic 
            });

        } catch (err) {
            console.error(err);
            toast.error("Could not access Camera or Microphone.");
            resetCall();
        }
    };

    const acceptCall = async (callerId, type) => {
        try {
            stopSounds();
            const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints(type));
            
            setLocalStream(stream);
            setIsCallConnected(true);
            setCallStatus("connected");
            startTimer();

            if (incomingCallRef.current) {
                incomingCallRef.current.answer(stream);
                activeCallRef.current = incomingCallRef.current;
                
                incomingCallRef.current.on("stream", (incomingRemoteStream) => {
                    setRemoteStream(incomingRemoteStream);
                });
            }

            dispatch(setCallState({ 
                active: true, 
                isReceivingCall: false 
            }));

            socket.emit("call:accepted", { to: callerId });

        } catch (err) {
            console.error(err);
            toast.error("Permissions denied to answer call.");
            rejectCall(callerId);
        }
    };

    const rejectCall = (callerId) => {
        socket.emit("call:ended", { to: callerId });
        resetCall();
    };

    const endCall = (remoteId) => {
        socket.emit("call:ended", { to: remoteId });
        resetCall();
    };

    const resetCall = () => {
        clearInterval(timerIntervalRef.current);
        stopSounds();
        stopAllTracks(localStream);
        
        if (activeCallRef.current) {
            activeCallRef.current.close();
        }

        setLocalStream(null);
        setRemoteStream(null);
        setCallDuration(0);
        setIsCallConnected(false);
        setCallStatus("idle");
        
        dispatch(setCallState({
            active: false,
            isReceivingCall: false,
            from: null,
            remoteName: null,
            remotePic: null,
            type: null
        }));
    };

    return (
        <CallContext.Provider
            value={{
                localStream,
                remoteStream,
                myVideo,
                userVideo,
                callDuration,
                isCallConnected,
                callStatus,
                initiateCall,
                acceptCall,
                rejectCall,
                endCall
            }}
        >            
            <audio ref={ringtoneRef} loop preload="auto" src="https://assets.mixkit.co/active_storage/sfx/1359/1359-84.wav" className="hidden" />
            <audio ref={ringbackRef} loop preload="auto" src="https://assets.mixkit.co/active_storage/sfx/2578/2578-84.wav" className="hidden" />
            
            {children}
        </CallContext.Provider>
    );
};