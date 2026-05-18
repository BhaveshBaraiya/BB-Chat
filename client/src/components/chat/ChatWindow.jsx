import { useContext, useState, useRef, useEffect } from "react";

import {
    FiArrowLeft,
    FiPhone,
    FiVideo,
    FiMoreVertical,
    FiSmile,
    FiPaperclip,
    FiSend
} from "react-icons/fi";

import EmojiPicker from "emoji-picker-react";

import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";

import useMessages from "../../hooks/useMessages";
import useSendMessage from "../../hooks/useSendMessage";

import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ReplyPreview from "./ReplyPreview";


export default function ChatWindow() {

    const {
        selectedChat,
        setSelectedChat,
        typingUsers,
        setUnreadCounts
    } = useContext(ChatContext);

    const { user } =
        useContext(AuthContext);

    const {
        socket,
        onlineUsers
    } = useContext(SocketContext);

    const {
        messages,
        setMessages
    } = useMessages();

    const {
        sendMessage
    } = useSendMessage();


    const [text,setText] =
        useState("");

    const [showEmoji,setShowEmoji] =
        useState(false);


    const messagesEndRef =
        useRef(null);

    const emojiRef =
        useRef(null);


    const isOnline =
        onlineUsers.includes(
            selectedChat?._id
        );



    // AUTO SCROLL

    useEffect(()=>{

        messagesEndRef.current?.
        scrollIntoView({
            behavior:"smooth"
        });

    },[messages]);



    // USER COMES ONLINE
    // SINGLE -> DOUBLE TICKS

    useEffect(()=>{

        if(
            !socket ||
            !selectedChat
        ) return;


        const handleUserOnline=
        (onlineUserId)=>{

            if(
                onlineUserId !==
                selectedChat._id
            ) return;


            setMessages(prev=>

                prev.map(msg=>

                    msg.senderId===
                    user._id &&

                    !msg.delivered

                    ?{
                        ...msg,
                        delivered:true
                    }

                    :msg
                )

            );

        };


        socket.on(
            "userCameOnline",
            handleUserOnline
        );


        return()=>{

            socket.off(
                "userCameOnline",
                handleUserOnline
            );

        };

    },[
        socket,
        selectedChat,
        user._id
    ]);



    // MARK CHAT MESSAGES AS SEEN

    useEffect(()=>{

        if(
            !socket ||
            !selectedChat
        ) return;


        const unseenMessages=
        messages.filter(

            msg=>

            msg.senderId===
            selectedChat._id &&

            !msg.seen

        );


        if(
            !unseenMessages.length
        ) return;



        unseenMessages.forEach(msg=>{

            socket.emit(
                "messageSeen",
                {
                    messageId:
                    msg._id,

                    senderId:
                    msg.senderId
                }
            );

        });


        setMessages(prev=>

            prev.map(msg=>

                msg.senderId===
                selectedChat._id &&

                !msg.seen

                ?{
                    ...msg,
                    seen:true,
                    delivered:true
                }

                :msg
            )

        );

    },[
        messages,
        selectedChat,
        socket
    ]);



    // REMOVE BADGE WHEN CHAT OPENED

    useEffect(()=>{

        if(
            !selectedChat
        ) return;


        setUnreadCounts(prev=>({

            ...prev,

            [selectedChat._id]:
            0

        }));


    },[
        selectedChat,
        setUnreadCounts
    ]);




    // CLOSE EMOJI

    useEffect(()=>{

        const handleClick=
        (e)=>{

            if(

                emojiRef.current &&

                !emojiRef.current.contains(
                    e.target
                )

            ){

                setShowEmoji(false);

            }

        };


        document.addEventListener(
            "mousedown",
            handleClick
        );


        return()=>{

            document.removeEventListener(
                "mousedown",
                handleClick
            );

        };

    },[]);



    if(!selectedChat){

        return(

            <div className="flex-1 hidden md:flex items-center justify-center bg-slate-50">

                <div className="text-center">

                    <h2 className="text-2xl font-bold text-slate-700">

                        Select a conversation

                    </h2>

                    <p className="text-slate-500 mt-2">

                        Start chatting 🚀

                    </p>

                </div>

            </div>

        );

    }



    const handleSend=()=>{

        if(
            !text.trim()
        ) return;


        sendMessage(text);

        setText("");

    };



    return(

        <div className="h-screen flex flex-col w-full">

            {/* HEADER */}

            <div className="h-[80px] bg-white border-b px-6 flex justify-between items-center">

                <div className="flex gap-3 items-center">

                    <button
                    onClick={()=>
                        setSelectedChat(null)
                    }
                    className="md:hidden"
                    >

                        <FiArrowLeft
                        size={22}
                        />

                    </button>


                    <img
                    src={
                        selectedChat.profilePic ||

                        `https://ui-avatars.com/api/?name=${selectedChat.fullName}`
                    }

                    className="w-12 h-12 rounded-full"
                    />

                    <div>

                        <h2 className="font-semibold">

                            {selectedChat.fullName}

                        </h2>

                        <p
                        className={`text-sm ${
                            isOnline
                            ?
                            "text-green-500"
                            :
                            "text-slate-400"
                        }`}
                        >

                            {
                                isOnline
                                ?
                                "Online"
                                :
                                "Offline"
                            }

                        </p>

                    </div>

                </div>


                <div className="flex gap-3">

                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">

                        <FiPhone/>

                    </button>

                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">

                        <FiVideo/>

                    </button>

                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">

                        <FiMoreVertical/>

                    </button>

                </div>

            </div>



            {/* MESSAGES */}

            <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50">

                <div className="space-y-2">

                    {messages.map(message=>(
                        <MessageBubble
    key={message._id}
    messageObj={message}
    message={message.text}
    own={
        (
            message.senderId?._id ||
            message.senderId
        )?.toString() === user._id.toString()
    }
    time={new Date(message.createdAt).toLocaleTimeString([],{
        hour:"2-digit",
        minute:"2-digit"
    })}
    delivered={message.delivered}
    seen={message.seen}
/>
                    ))}


                    {
                        typingUsers.includes(
                            selectedChat._id
                        )
                        &&
                        <TypingIndicator/>
                    }


                    <div ref={messagesEndRef}/>

                </div>

            </div>



            {/* INPUT */}

            <div className="bg-white border-t px-4 py-4">

                <ReplyPreview/>

                <div className="bg-slate-100 rounded-full px-4 h-[58px] flex items-center gap-3">


                    <div
                    ref={emojiRef}
                    className="relative"
                    >

                        <button
                        onClick={()=>
                            setShowEmoji(
                                !showEmoji
                            )
                        }
                        >

                            <FiSmile/>

                        </button>


                        {
                            showEmoji &&

                            <div className="absolute bottom-14 left-0 z-50">

                                <EmojiPicker
                                onEmojiClick={
                                    emojiData=>

                                    setText(
                                        prev=>
                                        prev+
                                        emojiData.emoji
                                    )
                                }
                                />

                            </div>
                        }

                    </div>


                    <button>

                        <FiPaperclip/>

                    </button>



                    <input

                    value={text}

                    onChange={(e)=>{

                        setText(
                            e.target.value
                        );


                        socket.emit(
                            "typing:start",
                            {
                                receiverId:
                                selectedChat._id,

                                userId:
                                user._id
                            }
                        );


                        clearTimeout(
                            window.typingTimeout
                        );


                        window.typingTimeout=

                        setTimeout(()=>{

                            socket.emit(
                                "typing:stop",
                                {
                                    receiverId:
                                    selectedChat._id,

                                    userId:
                                    user._id
                                }
                            );

                        },1000);

                    }}

                    placeholder="Type a message..."

                    className="flex-1 bg-transparent outline-none"

                    />


                    <button

                    onClick={
                        handleSend
                    }

                    className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center"

                    >

                        <FiSend/>

                    </button>

                </div>

            </div>

        </div>

    );

}