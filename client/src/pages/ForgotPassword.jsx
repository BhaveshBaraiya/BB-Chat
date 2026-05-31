import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiKey, FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../services/axios";
import Logo from "../components/ui/Logo";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!formData.email) return toast.error("Please enter your email");
        
        try {
            setLoading(true);
            const { data } = await axiosInstance.post("/auth/forgot-password", { email: formData.email });
            toast.success(data.message);
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        if (!formData.otp || formData.otp.length < 6) return toast.error("Please enter a valid 6-digit OTP");
        setStep(3);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error("Passwords do not match");
        }

        try {
            setLoading(true);
            const { data } = await axiosInstance.post("/auth/reset-password", {
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });
            toast.success(data.message);
            navigate("/login");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e5e7eb] dark:bg-[#111b21] flex items-center justify-center p-4 sm:p-8 relative font-sans">
            <div className="absolute top-0 left-0 w-full h-[35vh] bg-indigo-600 dark:bg-[#202c33] shadow-md z-0 transition-colors duration-300"></div>

            <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#202c33] rounded-xl shadow-2xl flex flex-col p-8 sm:p-12 border border-transparent dark:border-slate-700 transition-colors duration-300">
                <Link to="/login" className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                    <FiArrowLeft size={24} />
                </Link>
                
                <div className="flex justify-center"><Logo /></div>

                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        {step === 1 && "Forgot Password"}
                        {step === 2 && "Enter OTP"}
                        {step === 3 && "Reset Password"}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {step === 1 && "Enter your email address to receive a verification code."}
                        {step === 2 && `We sent a code to ${formData.email}`}
                        {step === 3 && "Create a strong new password."}
                    </p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-5">
                        <div className="relative">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="email" name="email" value={formData.email} onChange={handleChange}
                                placeholder="Email Address"
                                className="w-full h-14 bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-lg pl-12 pr-4 outline-none text-slate-800 dark:text-slate-200"
                            />
                        </div>
                        <button disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-70">
                            {loading ? "Sending..." : "Send Reset Code"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-5">
                        <div className="relative">
                            <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text" name="otp" maxLength="6" value={formData.otp} onChange={handleChange}
                                placeholder="6-Digit OTP"
                                className="w-full h-14 bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-lg pl-12 pr-4 outline-none text-slate-800 dark:text-slate-200 tracking-widest text-center text-lg"
                            />
                        </div>
                        <button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition">
                            Verify Code
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type={showPassword ? "text" : "password"} name="newPassword" value={formData.newPassword} onChange={handleChange}
                                placeholder="New Password"
                                className="w-full h-14 bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-lg pl-12 pr-12 outline-none text-slate-800 dark:text-slate-200"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                            </button>
                        </div>
                        <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                                placeholder="Confirm New Password"
                                className="w-full h-14 bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-lg pl-12 pr-12 outline-none text-slate-800 dark:text-slate-200"
                            />
                        </div>
                        <button disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-70">
                            {loading ? "Resetting..." : "Update Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}