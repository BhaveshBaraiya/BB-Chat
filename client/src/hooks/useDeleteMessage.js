import { useCallback } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../services/axios";
import { removeMessage, markMessageDeletedForAll } from "../redux/features/chatSlice";

export default function useDeleteMessage() {
    const dispatch = useDispatch();

    const deleteForMe = useCallback(async (messageId) => {
        try {
            await axiosInstance.put(`/messages/delete/me/${messageId}`);
            dispatch(removeMessage(messageId));
        } catch (error) {
            console.log(error);
        }
    }, [dispatch]);

    const deleteForEveryone = useCallback(async (messageId) => {
        try {
            await axiosInstance.put(`/messages/delete/all/${messageId}`);
            dispatch(markMessageDeletedForAll(messageId));
        } catch (error) {
            console.log(error);
        }
    }, [dispatch]);

    return { deleteForMe, deleteForEveryone };
}