import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../services/axios";
import { setMessages } from "../redux/features/chatSlice";

export default function useMessages() {
    const dispatch = useDispatch();

    const selectedChat = useSelector(
        (state) => state.chat.selectedChat
    );

    const messages = useSelector(
        (state) => state.chat.messages
    );

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedChat?._id) return;

        dispatch(setMessages([]));
        setLoading(true);

        const fetchMessages = async () => {
            try {
                const { data } = await axiosInstance.get(
                    `/messages/${selectedChat._id}`
                );

                dispatch(setMessages(data.messages));
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [selectedChat?._id, dispatch]);

    return { messages, loading };
}