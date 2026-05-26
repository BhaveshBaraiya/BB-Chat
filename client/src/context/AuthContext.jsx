import { createContext, useEffect, useState } from "react";
import axiosInstance from "../services/axios";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const updateUser = (updatedUser) => {
        setUser(prev => ({
            ...prev,
            ...updatedUser
        }));
    };

    const getCurrentUser = async () => {
        try {
            const { data } = await axiosInstance.get("/auth/me");
            setUser(data.user);
        } catch (error) {
            console.log(error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCurrentUser();
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            loading,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}