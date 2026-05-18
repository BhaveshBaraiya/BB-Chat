export default function ConversationCard({
    active,
    image,
    name,
    message,
    time,
    unread,
    online
}) {

    return (
        <div
            className={`
                p-3
                rounded-3xl
                cursor-pointer
                transition
                flex
                items-center
                gap-3
                ${active ? "bg-indigo-50" : "hover:bg-slate-100"}
            `}
        >

            <div className="relative">
                <img
                    src={image}
                    alt={name}
                    className="w-14 h-14 rounded-full object-cover"
                />
                {online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 truncate">
                        {name}
                    </h3>
                    <span className="text-xs text-slate-400">
                        {time}
                    </span>
                </div>

                <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-slate-500 truncate">
                        {message}
                    </p>

                    {!!unread && (
                        <span className="min-w-5 h-5 px-1 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                            {unread}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}