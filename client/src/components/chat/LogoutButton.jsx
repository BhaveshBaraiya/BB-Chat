import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import axiosInstance from "../../services/axios";
import { AuthContext } from "../../context/AuthContext";

export default function LogoutButton() {

    const navigate = useNavigate();

    const { setUser } = useContext(AuthContext);

    const handleLogout = async () => {

        try {
            const { data } = await axiosInstance.post( "/auth/logout");

            setUser(null);

            toast.success(data.message);

            navigate("/");

        } catch {
            toast.error(
                "Logout failed"
            );
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="w-full h-12 rounded-2xl bg-red-500 text-white font-medium hover:opacity-90 transition">
            Logout
        </button>
    )
}