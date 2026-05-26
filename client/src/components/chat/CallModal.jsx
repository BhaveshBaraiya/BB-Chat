import { useContext } from "react";
import { CallContext } from "../../context/CallContext";
import { FiPhone, FiX } from "react-icons/fi";

export default function CallModal({ acceptCall, rejectCall }) {
    const { call } = useContext(CallContext);
    if (!call.isReceivingCall) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60">
            <div className="bg-white p-6 rounded-2xl shadow-2xl text-center">
                <h2 className="text-xl font-bold mb-4">Incoming {call.type} call...</h2>
                <div className="flex gap-4 justify-center">
                    <button onClick={rejectCall} className="bg-red-500 text-white p-4 rounded-full"><FiX size={24}/></button>
                    <button onClick={acceptCall} className="bg-green-500 text-white p-4 rounded-full"><FiPhone size={24}/></button>
                </div>
            </div>
        </div>
    );
}