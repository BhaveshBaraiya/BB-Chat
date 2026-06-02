import { useCallback } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../services/axios";
import { updateUser } from "../redux/features/authSlice";
import { updateChatUser } from "../redux/features/chatSlice";

export default function useUpdateProfile() {
    const dispatch = useDispatch();

    const updateProfile = useCallback(async (formData) => {
        const { data } = await axiosInstance.put(
            "/users/profile",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );

        const updatedUser = {
            ...data,
            profilePic: data.profilePic ? `${data.profilePic}?t=${Date.now()}` : data.profilePic
        };

        dispatch(updateUser(updatedUser));
        dispatch(updateChatUser(updatedUser));
        return updatedUser;
    }, [dispatch]);

    return { updateProfile };
}