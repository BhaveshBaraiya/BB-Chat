import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiKey } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../services/axios";
import Logo from "../components/ui/Logo";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/features/authSlice";

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState("");
    
    // Grab the email passed from the Register or Login page
    const email = location.state?.email || "";

    useEffect(() => {
        if (!email) {
            toast.error("No email found. Please sign up or log in again.");
            navigate("/login");
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (otp.length < 6) {
            return toast.error("Please enter the full 6-digit verification code");
        }

        try {
            setLoading(true);
            const { data } = await axiosInstance.post("/auth/verify-email", { email, otp });
            
            // If the verification also returns the user/token to log them in automatically
            if (data.user) {
                dispatch(setUser(data.user));
            }
            
            toast.success("Email verified successfully!");
            navigate("/chat");
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid verification code.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await axiosInstance.post("/auth/resend-verification", { email });
            toast.success("A new code has been sent to your email.");
        } catch (error) {
            toast.error("Failed to resend code. Please try again later.");
        }
    }

    return (
        <div className="min-h-screen bg-[#e5e7eb] dark:bg-[#111b21] flex items-center justify-center p-4 relative font-sans">
             <div className="absolute top-0 left-0 w-full h-[35vh] bg-indigo-600 dark:bg-[#202c33] shadow-md z-0 transition-colors duration-300"></div>

            <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#202c33] rounded-xl shadow-2xl p-8 sm:p-10 border border-transparent dark:border-slate-700 text-center">
                <div className="flex justify-center mb-6"><Logo /></div>
                
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">Verify your email</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    We've sent a 6-digit confirmation code to <br/>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{email}</span>. 
                    Please enter it below.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative flex justify-center">
                        <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                        <input
                            type="text"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                            placeholder="000000"
                            className="w-full h-14 bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-lg pl-12 pr-4 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-colors tracking-[0.5em] font-mono text-center text-xl"
                        />
                    </div>

                    <button disabled={loading} className="w-full h-14 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-lg shadow-md transition-colors disabled:opacity-70 flex items-center justify-center">
                        {loading ? "Verifying..." : "Verify Account"}
                    </button>
                </form>

                <p className="mt-8 text-slate-500 dark:text-slate-400 font-medium">
                    Didn't receive the code? 
                    <button type="button" onClick={handleResend} className="text-indigo-600 dark:text-indigo-400 hover:underline ml-2">
                        Resend
                    </button>
                </p>
            </div>
        </div>
    );
}