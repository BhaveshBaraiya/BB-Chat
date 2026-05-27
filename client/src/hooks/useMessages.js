import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../services/axios";
import { setMessages } from "../redux/features/chatSlice";

export default function useMessages() {
    const dispatch = useDispatch();
    const selectedChat = useSelector((state) => state.chat.selectedChat);
    const messages = useSelector((state) => state.chat.messages);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedChat) return;
            try {
                const { data } = await axiosInstance.get(`/messages/${selectedChat._id}`);
                dispatch(setMessages(data.messages));
            } catch (error) {
                console.log(error);
            }
        };

        fetchMessages();
    }, [selectedChat, dispatch]);

    return { messages };
}