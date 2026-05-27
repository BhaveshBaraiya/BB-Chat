import { useSelector } from "react-redux";
import { useContext, useEffect, useState } from "react";
import { CallContext } from "../../context/CallContext";
import { FiPhoneMissed, FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";

export default function CallOverlay({ onEndCall }) {
    const call = useSelector((state) => state.call);
    const { myVideo, userVideo } = useContext(CallContext);
    
    // Track toggle states
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    
    useEffect(() => {
        if(call.active && call.stream && myVideo.current) { 
            myVideo.current.srcObject = call.stream; 
        }
    }, [call.active, call.stream, myVideo]);

    if (!call.active) return null;

    // --- HARDWARE TOGGLES ---
    const toggleMute = () => {
        if (call.stream) {
            call.stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (call.stream) {
            call.stream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const isVideo = call.type === 'video';
    const picUrl = call.remotePic 
        ? `${call.remotePic}?t=${Date.now()}` 
        : `https://ui-avatars.com/api/?name=${call.remoteName || 'User'}&size=200`;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#111b21] flex flex-col items-center justify-center text-white overflow-hidden">
            
            {isVideo ? (
                <div className="relative w-full h-full">
                    {/* Remote User */}
                    <video ref={userVideo} autoPlay className="w-full h-full object-cover" />
                    
                    {/* Local User (PiP) */}
                    <div className="absolute top-6 right-6 md:bottom-24 md:right-10 md:top-auto w-28 h-40 md:w-48 md:h-64 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-50 transition-opacity">
                        <video ref={myVideo} autoPlay muted className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
                        {isVideoOff && <div className="absolute inset-0 flex items-center justify-center bg-gray-900"><FiVideoOff size={32} className="text-gray-500"/></div>}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                        <img src={picUrl} alt="remote user" className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover relative z-10 border-4 border-[#111b21] shadow-2xl" />
                    </div>
                    <h2 className="text-3xl font-medium mb-2">{call.remoteName || 'User'}</h2>
                    <p className="text-green-500 mb-12">Connected</p>
                    <video ref={myVideo} autoPlay muted className="hidden" />
                    <video ref={userVideo} autoPlay className="hidden" />
                </div>
            )}

            {/* --- CONTROLS --- */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-6 px-4 z-[9999]">
                <button onClick={toggleMute} className={`${isMuted ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white'} backdrop-blur-md p-4 rounded-full transition shadow-lg`}>
                    {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
                </button>
                
                {isVideo && (
                    <button onClick={toggleVideo} className={`${isVideoOff ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white'} backdrop-blur-md p-4 rounded-full transition shadow-lg hidden md:block`}>
                        {isVideoOff ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
                    </button>
                )}
                
                <button onClick={onEndCall} className="bg-red-500 hover:bg-red-600 p-5 rounded-full transition shadow-lg transform hover:scale-105">
                    <FiPhoneMissed size={28} />
                </button>
            </div>
        </div>
    );
}