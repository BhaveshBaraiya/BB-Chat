import { useCallback } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../services/axios";
import { updateMessageReaction } from "../redux/features/chatSlice";

export default function useReaction() {
    const dispatch = useDispatch();

    const reactToMessage = useCallback(async (messageId, emoji) => {
        try {
            const { data } = await axiosInstance.put(
                "/messages/react",
                { messageId, emoji }
            );
            dispatch(updateMessageReaction(data.message));
        } catch (error) {
            console.log(error);
        }
    }, [dispatch]);

    return { reactToMessage };
}