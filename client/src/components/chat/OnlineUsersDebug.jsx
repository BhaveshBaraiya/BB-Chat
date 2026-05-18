import { useContext } from "react";

import {
    SocketContext
} from "../../context/SocketContext";

export default function OnlineUsersDebug() {

    const {
        onlineUsers
    } = useContext(
        SocketContext
    );

    return (
        <div className="fixed bottom-5 right-5 bg-white rounded-2xl shadow-lg p-4 w-[220px]">

            <h3 className="font-semibold text-slate-800 mb-2">
                Online Users
            </h3>

            <p className="text-sm text-slate-500">
                {
                    onlineUsers.length
                } connected
            </p>

        </div>
    )
}