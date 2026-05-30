import { useSelector } from "react-redux";
import { useContext } from "react";
import { CallContext } from "../../context/CallContext";
import { FiPhone, FiVideo, FiX } from "react-icons/fi";

export default function CallModal() {
    const call = useSelector((state) => state.call);
    const { acceptCall, rejectCall } = useContext(CallContext);
    
    if (!call.isReceivingCall) return null;

    const picUrl = call.remotePic 
        ? `${call.remotePic}?t=${Date.now()}` 
        : `https://ui-avatars.com/api/?name=${call.remoteName || 'User'}&size=150`;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4">

            <div className="bg-[#1c1c1c] w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center border border-white/5 relative overflow-hidden">
                <div className="relative mb-6 mt-4">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-30"></div>
                    <img 
                        src={picUrl} 
                        alt="caller" 
                        className="w-28 h-28 rounded-full object-cover relative z-10 border-4 border-[#1c1c1c]"
                    />
                </div>

                <h2 className="text-2xl font-bold text-white mb-1 tracking-wide">{call.remoteName || 'Incoming Call'}</h2>
                <p className="text-slate-400 mb-12 flex items-center gap-2 font-medium">
                    {call.type === 'video' ? <FiVideo /> : <FiPhone />}
                    WhatsApp {call.type === 'video' ? 'Video' : 'Audio'} Call
                </p>

                <div className="flex gap-14 justify-center w-full relative z-[1001] pointer-events-auto mb-2">
                    <div className="flex flex-col items-center gap-3">
                        <button 
                            onClick={(e) => { e.preventDefault(); rejectCall(call.from); }} 
                            onTouchEnd={(e) => { e.preventDefault(); rejectCall(call.from); }}
                            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition transform hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95"
                        >
                            <FiX size={30} />
                        </button>
                        <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Decline</span>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <button 
                            onClick={(e) => { e.preventDefault(); acceptCall(call.from, call.type); }} 
                            onTouchEnd={(e) => { e.preventDefault(); acceptCall(call.from, call.type); }}
                            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition transform hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-bounce active:scale-95"
                        >
                            {call.type === 'video' ? <FiVideo size={30} /> : <FiPhone size={30} />}
                        </button>
                        <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Accept</span>
                    </div>
                </div>
            </div>
        </div>
    );
}