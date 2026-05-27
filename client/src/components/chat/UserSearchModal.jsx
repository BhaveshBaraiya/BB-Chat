import { useState } from "react";
import useSearchUsers from "../../hooks/useSearchUsers";

export default function UserSearchModal({show, onClose, onSelect}) {

    const [query, setQuery] = useState("");
    const { users, searchUsers } = useSearchUsers();
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center">
            <div className="bg-white rounded-2xl w-[420px] p-5">
                <h2 className="font-semibold text-lg mb-4">
                    Start New Chat
                </h2>

                <input
                    value={query}
                    onChange={(e) => {
                        const value = e.target.value;
                        setQuery(value);
                        searchUsers(value);
                    }}
                    placeholder="Search by name or email"
                    className="w-full border p-3 rounded-xl outline-none"
                />

                <div className="mt-4 max-h-[350px] overflow-y-auto">

                    {
                        users.map(user => (
                            <div
                                key={user._id}
                                onClick={() => {
                                    onSelect(user)
                                    onClose()
                                }}
                                className="flex items-center gap-3 hover:bg-slate-100 p-3 rounded-xl cursor-pointer">

                                <img src={user.profilePic} className="w-12 h-12 rounded-full" />

                                <div>
                                    <div className="font-medium">
                                        {user.fullName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {user.email}
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
                <button onClick={onClose} className="mt-4 w-full bg-slate-100 rounded-xl p-3">
                    Close
                </button>
            </div>
        </div>
    )
}