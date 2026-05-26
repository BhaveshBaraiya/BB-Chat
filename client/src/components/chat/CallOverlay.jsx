import { useContext } from "react";
import { CallContext } from "../../context/CallContext";
import { FiPhone, FiX, FiVideo } from "react-icons/fi";

export default function CallOverlay({ onEndCall, onAccept }) {
    const { call, myVideo, userVideo } = useContext(CallContext);
    if (!call.isReceivingCall && !call.active) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-white">
            <div className="flex gap-4 w-full h-[60vh] p-4">
                <video ref={myVideo} autoPlay muted className="w-1/2 bg-gray-800 rounded-xl" />
                <video ref={userVideo} autoPlay className="w-1/2 bg-gray-800 rounded-xl" />
            </div>
            
            <div className="flex gap-6 mt-8">
                {call.isReceivingCall && (
                    <button onClick={onAccept} className="bg-green-500 p-4 rounded-full"><FiPhone size={32}/></button>
                )}
                <button onClick={onEndCall} className="bg-red-500 p-4 rounded-full"><FiX size={32}/></button>
            </div>
        </div>
    );
}