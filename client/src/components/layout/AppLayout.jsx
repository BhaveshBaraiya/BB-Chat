import { useState, useContext, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// Context
import { SocketContext } from "../../context/SocketContext";
import { CallContext } from "../../context/CallContext";

// Redux
import { setCallState, endCall as endCallAction } from "../../redux/features/callSlice";

// Components
import Sidebar from "./Sidebar";
import ChatWindow from "../chat/ChatWindow";
import ProfilePanel from "../chat/ProfilePanel";
import LeftRail from "./LeftRail";
import CallModal from "../chat/CallModal";
import CallOverlay from "../chat/CallOverlay";

// Hooks
import useListenMessages from "../../hooks/useListenMessages";
import useSendMessage from "../../hooks/useSendMessage";

export default function AppLayout() {
  const dispatch = useDispatch();
  const { socket } = useContext(SocketContext);
  const { myVideo, userVideo, peerRef, connectionRef } = useContext(CallContext);

  const call = useSelector((state) => state.call);
  const selectedChatRedux = useSelector((state) => state.chat.selectedChat);

  const { sendMessage } = useSendMessage();
  useListenMessages();

  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");

  // ====================
  // CALL CLEANUP
  // ====================
  const cleanupCall = useCallback(() => {
    // Stop local and remote streams
    [call?.stream, myVideo?.current?.srcObject, userVideo?.current?.srcObject].forEach((stream) => {
      stream?.getTracks().forEach((track) => track.stop());
    });

    if (myVideo?.current) myVideo.current.srcObject = null;
    if (userVideo?.current) userVideo.current.srcObject = null;

    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }

    dispatch(endCallAction());
  }, [call, myVideo, userVideo, connectionRef, dispatch]);

  // ====================
  // PEER CALL LOGIC
  // ====================
  useEffect(() => {
    if (!peerRef?.current) return;

    peerRef.current.on("call", (incomingCall) => {
      connectionRef.current = incomingCall;
    });
  }, [peerRef, connectionRef]);

  // ====================
  // SOCKET EVENT LISTENERS
  // ====================
  useEffect(() => {
    if (!socket) return;

    const incoming = (data) => {
      dispatch(setCallState({
        isReceivingCall: true,
        from: data.from,
        type: data.type,
        peerId: data.peerId,
        remoteName: data.callerName,
        remotePic: data.callerPic
      }));
    };

    const accepted = () => {
      dispatch(setCallState({ active: true }));
    };

    socket.on("call:incoming", incoming);
    socket.on("call:accepted", accepted);
    socket.on("call:ended", cleanupCall);

    return () => {
      socket.off("call:incoming", incoming);
      socket.off("call:accepted", accepted);
      socket.off("call:ended", cleanupCall);
    };
  }, [socket, cleanupCall, dispatch]);

  // ====================
  // CALL ACTIONS
  // ====================
  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: call.type === "video",
        audio: true
      });

      dispatch(setCallState({ stream, active: true, isReceivingCall: false }));

      if (connectionRef.current) {
        connectionRef.current.answer(stream);
        connectionRef.current.on("stream", (remote) => {
          if (userVideo?.current) userVideo.current.srcObject = remote;
        });
      }

      sendMessage("📞 Call accepted");
      socket.emit("call:accepted", { to: call.from });
    } catch (err) {
      console.error("Call acceptance failed:", err);
    }
  };

  const rejectCall = () => {
    socket.emit("call:ended", { to: call.from });
    cleanupCall();
  };

  const endCall = () => {
    socket.emit("call:ended", { to: call.from });
    sendMessage("📞 Call ended");
    cleanupCall();
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F0F2F5]">
      <CallModal acceptCall={acceptCall} rejectCall={rejectCall} />
      <CallOverlay onEndCall={endCall} />

      {/* MOBILE TOP RAIL */}
      <div className="lg:hidden h-[65px] border-b bg-white">
        <LeftRail activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div className="flex h-[calc(100vh-65px)] lg:h-screen">
        {/* DESKTOP LEFT RAIL */}
        <div className="hidden lg:block">
          <LeftRail activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* SIDEBAR */}
        <div className={`w-full md:w-[380px] bg-white ${selectedChatRedux ? "hidden md:hidden lg:block" : "block"}`}>
          <Sidebar activeTab={activeTab} />
        </div>

        {/* CHAT WINDOW */}
        <div className={`flex-1 ${!selectedChatRedux ? "hidden md:hidden lg:flex" : "flex"}`}>
          <ChatWindow setShowProfile={setShowProfile} />
        </div>

        {/* PROFILE PANEL */}
        <div className="hidden lg:block">
          <ProfilePanel />
        </div>
      </div>
    </div>
  );
}