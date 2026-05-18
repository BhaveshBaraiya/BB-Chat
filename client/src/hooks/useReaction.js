import { useContext } from "react";
import axiosInstance from "../services/axios";

import { ChatContext }
from "../context/ChatContext";

import { SocketContext }
from "../context/SocketContext";

export default function useReaction(){

const {
    selectedChat,
    setMessages
}=useContext(
    ChatContext
);

const {socket}=
useContext(
    SocketContext
);

const reactToMessage=
async(
messageId,
emoji
)=>{

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

?data.message

:msg

)

);

socket.emit(
"messageReaction",
{
receiverId:
selectedChat._id,

message:
data.message
}
);

}

catch(error){

console.log(error);

}

};

return {
reactToMessage
};

}