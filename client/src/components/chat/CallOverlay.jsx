import { useSelector } from "react-redux";
import { useContext, useEffect, useState } from "react";
import { CallContext } from "../../context/CallContext";
import { FiPhoneMissed, FiMic, FiMicOff, FiVideo, FiVideoOff, FiVolume2, FiVolumeX } from "react-icons/fi";

export default function CallOverlay() {
    const call = useSelector((state) => state.call);
    const { localStream, remoteStream, myVideo, userVideo, callDuration, isCallConnected, callStatus, endCall } = useContext(CallContext);
    
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    
    // 1. Reset hardware toggles for every NEW call
    useEffect(() => {
        if (call.active) {
            setIsMuted(false);
            setIsVideoOff(false);
            setIsSpeakerOn(false);
            if (userVideo.current) userVideo.current.muted = false;
        }
    }, [call.active, call.from]);

    // 2. Attach streams to HTML elements safely (forces mobile playback)
    useEffect(() => {
        if (localStream && myVideo.current) {
            myVideo.current.srcObject = localStream;
            myVideo.current.play().catch(e => console.warn("Local play blocked:", e));
        }
    }, [localStream, myVideo, isCallConnected]);

    useEffect(() => {
        if (remoteStream && userVideo.current) {
            userVideo.current.srcObject = remoteStream;
            userVideo.current.play().catch(e => console.warn("Remote play blocked:", e));
        }
    }, [remoteStream, userVideo, isCallConnected]);

    if (!call.active || call.isReceivingCall) return null;

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const toggleSpeaker = () => {
        if (userVideo.current) {
            // Web browser fallback for "Speaker": muting the incoming track
            const nextState = !isSpeakerOn;
            userVideo.current.muted = nextState;
            setIsSpeakerOn(nextState);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isVideo = call.type === 'video';
    const picUrl = call.remotePic 
        ? `${call.remotePic}?t=${Date.now()}` 
        : `https://ui-avatars.com/api/?name=${call.remoteName || 'User'}&size=200`;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#111b21] flex flex-col items-center justify-center text-white overflow-hidden">

            {isVideo ? (
                <div className="relative w-full h-full bg-black">
                    {/* Remote Stream Video */}
                    <video ref={userVideo} autoPlay playsInline className="w-full h-full object-cover" />
                    
                    {/* Local Stream PiP */}
                    <div className="absolute top-6 right-6 md:bottom-24 md:right-10 md:top-auto w-28 h-40 md:w-48 md:h-64 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-50">
                        <video ref={myVideo} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
                        {isVideoOff && <div className="absolute inset-0 flex items-center justify-center bg-gray-900"><FiVideoOff size={32} className="text-gray-500"/></div>}
                    </div>

                    <div className="absolute top-6 left-6 z-50 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
                        <p className="text-sm font-medium tracking-wide">
                            {isCallConnected ? formatTime(callDuration) : "Calling..."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="relative mb-8 mt-12">
                        {!isCallConnected && callStatus === 'calling' && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>}
                        <img src={picUrl} alt="Remote user" className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover relative z-10 border-4 border-[#111b21] shadow-2xl" />
                    </div>
                    <h2 className="text-3xl font-medium mb-2">{call.remoteName || 'User'}</h2>
                    <p className={`${isCallConnected ? 'text-green-500' : 'text-slate-400 animate-pulse'} mb-12 text-lg font-medium tracking-wide`}>
                        {isCallConnected ? formatTime(callDuration) : "Calling..."}
                    </p>
                    
                    {/* Background Audio Players for Voice Calls */}
                    <audio ref={myVideo} autoPlay playsInline muted className="hidden" />
                    <audio ref={userVideo} autoPlay playsInline className="hidden" />
                </div>
            )}

            {/* Hardware Controls */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-5 sm:gap-6 px-4 z-[9999]">
                <button onClick={toggleMute} className={`${isMuted ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white'} backdrop-blur-md p-4 sm:p-5 rounded-full transition shadow-lg`}>
                    {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
                </button>
                
                <button onClick={toggleSpeaker} className={`${isSpeakerOn ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'} backdrop-blur-md p-4 sm:p-5 rounded-full transition shadow-lg`}>
                    {isSpeakerOn ? <FiVolumeX size={24} /> : <FiVolume2 size={24} />}
                </button>
                
                {isVideo && (
                    <button onClick={toggleVideo} className={`${isVideoOff ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white'} backdrop-blur-md p-4 sm:p-5 rounded-full transition shadow-lg`}>
                        {isVideoOff ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
                    </button>
                )}
                
                <button onClick={() => endCall(call.from)} className="bg-red-500 hover:bg-red-600 p-5 sm:p-6 rounded-full transition shadow-lg transform hover:scale-105 active:scale-95">
                    <FiPhoneMissed size={28} />
                </button>
            </div>
        </div>
    );
}