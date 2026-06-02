export default function TypingIndicator() {

    return (
        <div className="flex items-center gap-1 px-4 py-3 ml-2 bg-white rounded-full w-fit shadow-sm">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
            <span
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
            ></span>
            <span
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
            ></span>
        </div>
    )
}