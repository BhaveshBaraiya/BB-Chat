import { useContext } from "react";
import axiosInstance from "../services/axios";
import { ChatContext } from "../context/ChatContext";

export default function useReaction() {

    const { setMessages } =
        useContext(ChatContext);

    const reactToMessage =
    async(messageId,emoji)=>{

        try{

            const {data}=
            await axiosInstance.put(
                "/messages/react",
                {
                    messageId,
                    emoji
                }
            );

            setMessages(prev=>

                prev.map(msg=>

                    msg._id===messageId
                    ? data.message
                    : msg

                )

            );

        }

        catch(error){

            console.log(
                error
            );

        }

    };

    return{
        reactToMessage
    };

}