import { useCallback } from "react";
import axiosInstance from "../services/axios";

export default function useEditMessage() {
    const editMessage = useCallback(async (messageId, text) => {
        try {
            await axiosInstance.put(
                `/messages/edit/${messageId}`,
                { text }
            );
        } catch (error) {
            console.log(error);
        }
    }, []);

    return { editMessage };
}