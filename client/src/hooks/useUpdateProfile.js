import axiosInstance from "../services/axios";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";

export default function useUpdateProfile() {

    const { setUser } = useContext(AuthContext);
    const { updateChatUser } = useContext(ChatContext);

    const updateProfile = async (formData) => {

        const { data } = await axiosInstance.put(
            "/users/profile",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );

        const updatedUser = {
            ...data,
            profilePic: data.profilePic
                ? `${data.profilePic}?t=${Date.now()}`
                : data.profilePic
        };

        setUser(updatedUser);

        // 🔥 THIS FIXES RECEIVER SIDE LIVE UPDATE
        updateChatUser(updatedUser);

        return updatedUser;
    };

    return { updateProfile };
}