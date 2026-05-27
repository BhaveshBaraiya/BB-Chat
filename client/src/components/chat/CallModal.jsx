import { useSelector } from "react-redux";
import { FiPhone, FiVideo, FiX } from "react-icons/fi";

export default function CallModal({ acceptCall, rejectCall }) {
    const call = useSelector((state) => state.call);
    
    if (!call.isReceivingCall) return null;

    const picUrl = call.remotePic 
        ? `${call.remotePic}?t=${Date.now()}` 
        : `https://ui-avatars.com/api/?name=${call.remoteName || 'User'}&size=150`;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <div className="bg-[#1c1c1c] w-full max-w-sm p-8 rounded-[2rem] shadow-2xl flex flex-col items-center border border-white/10">
        
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-30"></div>
                    <img 
                        src={picUrl} 
                        alt="caller" 
                        className="w-28 h-28 rounded-full object-cover relative z-10 border-4 border-[#1c1c1c]"
                    />
                </div>

                <h2 className="text-2xl font-bold text-white mb-1">{call.remoteName || 'Incoming Call'}</h2>
                <p className="text-slate-400 mb-10 flex items-center gap-2">
                    {call.type === 'video' ? <FiVideo /> : <FiPhone />}
                    WhatsApp {call.type === 'video' ? 'Video' : 'Audio'} Call
                </p>

                {/* Actions */}
                <div className="flex gap-12 justify-center w-full">
                    <div className="flex flex-col items-center gap-2">
                        <button 
                            onClick={rejectCall} 
                            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition transform hover:scale-105 shadow-lg"
                        >
                            <FiX size={28} />
                        </button>
                        <span className="text-slate-400 text-xs font-medium">Decline</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <button 
                            onClick={acceptCall} 
                            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition transform hover:scale-105 shadow-lg animate-bounce"
                        >
                            {call.type === 'video' ? <FiVideo size={28} /> : <FiPhone size={28} />}
                        </button>
                        <span className="text-slate-400 text-xs font-medium">Accept</span>
                    </div>
                </div>
            </div>
        </div>
    );
}