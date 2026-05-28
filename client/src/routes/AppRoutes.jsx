import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUser } from "../redux/features/authSlice"; 

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
    const dispatch = useDispatch();
    
    // Pull user and loading state from Redux
    const user = useSelector((state) => state.auth.user);
    const loading = useSelector((state) => state.auth.loading);

    // CRITICAL: Fetch user on initial app load!
    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    // Show a global loading spinner while checking the session
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Root Route */}
                <Route
                    path="/"
                    element={user ? <Navigate to="/chat" replace /> : <Login />}
                />
                
                {/* 👇 THE MISSING ROUTE 👇 */}
                <Route
                    path="/login"
                    element={user ? <Navigate to="/chat" replace /> : <Login />}
                />

                <Route
                    path="/register"
                    element={user ? <Navigate to="/chat" replace /> : <Register />}
                />
                
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
        </BrowserRouter>
    );
}