import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";

import toast from "react-hot-toast";
import validator from "validator";

import axiosInstance from "../../services/axios";
import { setUser } from "../../redux/features/authSlice";
import { useDispatch } from "react-redux";


export default function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
            email: "",
            password: ""
        });

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]:
                e.target.value
        }));

    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { email, password } = formData;

        if (!email || !password) {
            return toast.error("All fields required");
        }

        if (!validator.isEmail(email)) {
            return toast.error("Invalid email");
        }

        try {
            setLoading(true);
            const { data } = await axiosInstance.post("/auth/login",formData);
            dispatch(setUser(data.user));
            toast.success(data.message);
            navigate("/chat");
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Login failed"
            );

        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-5">
            <div className="w-full max-w-[420px] bg-white rounded-[32px] p-8 shadow-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">
                        Welcome Back
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Sign in to continue chatting
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email"
                            className="w-full h-14 bg-slate-100 rounded-2xl pl-12 pr-4 outline-none"/>

                    </div>
                    <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password"
                            className="w-full h-14 bg-slate-100 rounded-2xl pl-12 pr-4 outline-none"/>
                    </div>
                    
                    <button disabled={loading} className="w-full h-14 rounded-2xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition">
                        {
                            loading
                                ? "Logging in..."
                                : "Login"
                        }
                    </button>
                </form>

                <p className="text-center text-slate-500 mt-6">
                    Don't have an account?
                    <Link to="/register" className="text-indigo-500 ml-1">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    )
}