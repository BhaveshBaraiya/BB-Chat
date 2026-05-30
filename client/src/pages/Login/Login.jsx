import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiMessageSquare, FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import validator from "validator";
import axiosInstance from "../../services/axios";
import { setUser } from "../../redux/features/authSlice";
import { useDispatch } from "react-redux";
import Logo from "../../components/ui/Logo";

export default function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const email = validator.normalizeEmail(formData.email.trim());
        const password = formData.password;

        if (!email || !password) {
            return toast.error("All fields required");
        }

        if (!validator.isEmail(email)) {
            return toast.error("Invalid email format");
        }

        try {
            setLoading(true);
            const { data } = await axiosInstance.post("/auth/login", { email, password });
            dispatch(setUser(data.user));
            toast.success(data.message || "Welcome back!");
            navigate("/chat");
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.isVerified === false) {
                toast.error("Please verify your email before logging in.");
                return navigate("/verify-email", { state: { email } });
            }
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e5e7eb] dark:bg-[#111b21] flex items-center justify-center p-4 sm:p-8 relative font-sans">
            <div className="absolute top-0 left-0 w-full h-[35vh] bg-indigo-600 dark:bg-[#202c33] shadow-md z-0 transition-colors duration-300"></div>

            <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-[#202c33] rounded-xl shadow-2xl flex overflow-hidden min-h-[550px] border border-transparent dark:border-slate-700 transition-colors duration-300">
                <div
                    className="hidden md:flex md:w-1/2 bg-cover bg-center relative items-center justify-center"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop')" }}
                >
                    <div className="absolute inset-0 bg-indigo-900/70 dark:bg-black/70 mix-blend-multiply"></div>
                    <div className="relative z-10 text-white text-center p-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30 shadow-lg">
                            <FiMessageSquare size={40} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4 tracking-wide">Connect Instantly</h2>
                        <p className="text-indigo-100 dark:text-slate-300 text-base leading-relaxed max-w-sm">
                            Join the conversation and stay connected with your team, friends, and family securely.
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white dark:bg-[#202c33]">
                    <Logo/>
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Welcome Back</h1>
                        <p className="text-slate-500 dark:text-slate-400">Sign in to continue chatting</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email Address"
                                className="w-full h-14 bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-lg pl-12 pr-4 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Password"
                                className="w-full h-14 bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-lg pl-12 pr-12 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                            </button>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full h-14 mt-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-lg shadow-md transition-colors disabled:opacity-70 flex items-center justify-center"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Don't have an account?
                            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline ml-2">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}