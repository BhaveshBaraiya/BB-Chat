import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUser } from "../redux/features/authSlice"; 

const Login = lazy(() => import("../pages/Login/Login"));
const Register = lazy(() => import("../pages/Register/Register"));
const VerifyEmail = lazy(() => import('../pages/VerifyEmail'));
const AppLayout = lazy(() => import("../components/layout/AppLayout"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
import ProtectedRoute from "./ProtectedRoute";
import Logo from "../components/ui/Logo";
import { FiLock } from "react-icons/fi";

const AppLoader = () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F0F2F5] dark:bg-[#111B21]">        
        <div className="flex flex-col items-center z-10">
            <div className="mb-10 opacity-80">
                <Logo /> 
            </div>
            
            <div className="w-64 h-1 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full w-1/2 bg-indigo-500 rounded-full animate-smooth-slide"></div>
            </div>
            
            <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                Loading ChatApp...
            </p>
        </div>

        <div className="absolute bottom-10 flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-medium">
            <FiLock size={12} />
            <span>End-to-end encrypted</span>
        </div>
    </div>
);

export default function AppRoutes() {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const loading = useSelector((state) => state.auth.loading);

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);
    
    if (loading) return <AppLoader />;

    return (
        <BrowserRouter>
            <Suspense fallback={<AppLoader />}>
                <Routes>
                    <Route path="/" element={user ? <Navigate to="/chat" replace /> : <Login />} />
                    <Route path="/login" element={user ? <Navigate to="/chat" replace /> : <Login />} />
                    <Route path="/register" element={user ? <Navigate to="/chat" replace /> : <Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/chat" />} />
                    
                    <Route
                        path="/chat"
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}