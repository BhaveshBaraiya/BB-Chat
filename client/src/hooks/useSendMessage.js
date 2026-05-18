import { useContext, useState } from "react";

import axiosInstance from "../services/axios";

import { ChatContext } from "../context/ChatContext";
import { SocketContext } from "../context/SocketContext";

export default function useSendMessage() {

    const {
        selectedChat,
        setMessages,
        replyMessage,
        setReplyMessage
    } =
    useContext(ChatContext);

    const { socket } =
    useContext(SocketContext);

    const [loading,setLoading] =
    useState(false);


    const sendMessage =
    async(text)=>{

        if(!text.trim()) return;

        try{

            setLoading(true);

            const {data} =
            await axiosInstance.post(

                `/messages/send/${selectedChat._id}`,

                {
                    text,

                    replyTo:
                    replyMessage?._id
                }

            );


            const newMessage={

                ...data.message,

                receiverId:
                selectedChat._id

            };


            // instant UI

            setMessages(prev=>[

                ...prev,
                newMessage

            ]);


            socket.emit(
                "sendMessage",
                newMessage
            );


            // clear reply preview

            setReplyMessage(null);

        }

        catch(err){

            console.log(err);

        }

        finally{

            setLoading(false);

        }

    };


    return {
        sendMessage,
        loading
    };

}