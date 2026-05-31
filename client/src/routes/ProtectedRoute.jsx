import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { FiLoader } from "react-icons/fi"; 

export default function ProtectedRoute({ children }) {
    const user = useSelector((state) => state.auth.user);
    const loading = useSelector((state) => state.auth.loading);

    if (loading) {
        return (
            <div className="h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
                <FiLoader className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">
                    Loading your chats...
                </p>
            </div>
        );
    }

    return user ? children : <Navigate to="/" replace />; 
}