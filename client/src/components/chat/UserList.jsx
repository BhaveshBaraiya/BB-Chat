import { useContext } from "react";

import useUsers from "../../hooks/useUsers";

import { SocketContext } from "../../context/SocketContext";
import { ChatContext } from "../../context/ChatContext";

export default function UserList() {

    const { users } = useUsers();

    const { onlineUsers } =
        useContext(SocketContext);

    const {
        setSelectedChat,
        setUnreadCounts,
        unreadCounts
    } = useContext(ChatContext);

    const openChat = (chat) => {

        setSelectedChat(chat);

        setUnreadCounts(prev => ({
            ...prev,
            [chat._id]: 0
        }));
    };

    return (

        <div className="space-y-2">

            {

                users.map(user => (

                    <div
                        key={user._id}
                        onClick={() => openChat(user)}
                        className="
                        flex
                        items-center
                        justify-between
                        p-3
                        rounded-2xl
                        hover:bg-slate-100
                        cursor-pointer
                        transition
                        "
                    >

                        <div className="flex items-center gap-3">

                            <div className="relative">

                                <img
                                    src={
                                        user.profilePic ||

                                        `https://ui-avatars.com/api/?name=${user.fullName}`
                                    }

                                    alt=""
                                    className="
                                    w-12
                                    h-12
                                    rounded-full
                                    object-cover
                                    "
                                />

                                {

                                    onlineUsers.includes(
                                        user._id
                                    ) && (

                                        <span
                                            className="
                                            absolute
                                            bottom-0
                                            right-0
                                            w-3
                                            h-3
                                            bg-green-500
                                            rounded-full
                                            border-2
                                            border-white
                                            "
                                        />

                                    )

                                }

                            </div>

                            <div>

                                <h3 className="font-medium text-slate-800">

                                    {user.fullName}

                                </h3>

                                <p className="text-sm text-slate-500">

                                    {

                                        onlineUsers.includes(
                                            user._id
                                        )

                                        ?

                                        "Online"

                                        :

                                        "Offline"

                                    }

                                </p>

                            </div>

                        </div>

                        {

                            unreadCounts?.[user._id] > 0 && (

                                <div
                                    className="
                                    min-w-6
                                    h-6
                                    px-2
                                    rounded-full
                                    bg-indigo-500
                                    text-white
                                    flex
                                    items-center
                                    justify-center
                                    text-xs
                                    font-medium
                                    "
                                >

                                    {unreadCounts[user._id]}

                                </div>

                            )

                        }

                    </div>

                ))

            }

        </div>

    );

}