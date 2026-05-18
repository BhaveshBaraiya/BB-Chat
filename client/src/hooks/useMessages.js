import {
    useContext,
    useEffect
} from "react";

import axiosInstance from "../services/axios";

import { ChatContext } from "../context/ChatContext";

export default function useMessages() {

    const {
        selectedChat,
        messages,
        setMessages
    } = useContext(ChatContext);

    useEffect(() => {

        const fetchMessages = async () => {

            if (!selectedChat) return;

            try {

                const { data } =
                await axiosInstance.get(
                    `/messages/${selectedChat._id}`
                );

                setMessages(
                    data.messages
                );

            } catch (error) {

                console.log(error);

            }

        };

        fetchMessages();

    }, [selectedChat]);

    return {
        messages,
        setMessages
    };

}