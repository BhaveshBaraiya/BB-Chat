import { useContext } from "react";
import axiosInstance from "../services/axios";
import { ChatContext } from "../context/ChatContext";

export default function useDeleteMessage() {

    const {
        setMessages
    } = useContext(ChatContext);


    const deleteForMe = async (messageId) => {

        try {

            await axiosInstance.put(
                `/messages/delete/me/${messageId}`
            );


            setMessages(prev =>

                prev.filter(
                    msg => msg._id !== messageId
                )

            );

        }

        catch (error) {

            console.log(error);

        }

    };



    const deleteForEveryone = async (messageId) => {

        try {

            await axiosInstance.put(
                `/messages/delete/all/${messageId}`
            );


            setMessages(prev =>

                prev.map(msg =>

                    msg._id === messageId

                        ? {

                            ...msg,

                            text: "",

                            isDeletedForEveryone: true

                        }

                        : msg

                )

            );

        }

        catch (error) {

            console.log(error);

        }

    };



    return {

        deleteForMe,
        deleteForEveryone

    };

}