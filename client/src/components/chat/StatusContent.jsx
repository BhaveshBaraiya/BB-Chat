import { useState, useEffect, useRef, useContext } from "react";
import { FiPlus, FiCircle, FiX, FiSend, FiImage, FiVideo, FiEye, FiMusic, FiVideoOff, FiLink } from "react-icons/fi";
import { useSelector } from "react-redux";
import axiosInstance from "../../services/axios";
import toast from "react-hot-toast";
import { SocketContext } from "../../context/SocketContext";

export default function StatusContent() {
    const user = useSelector((state) => state.auth.user);
    const { socket } = useContext(SocketContext);
    const myProfilePic = user?.profilePic || `https://ui-avatars.com/api/?name=${user?.fullName}`;
    
    const [myStatusGroup, setMyStatusGroup] = useState(null);
    const [friendsStatuses, setFriendsStatuses] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    
    const [activeStoryGroup, setActiveStoryGroup] = useState(null);
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);
    const [showViewers, setShowViewers] = useState(false); 
    
    const [statusText, setStatusText] = useState("");
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [previewMediaUrl, setPreviewMediaUrl] = useState(null);
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const liveVideoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    const [showMusicInput, setShowMusicInput] = useState(false);
    const [musicTitle, setMusicTitle] = useState("");
    const [musicUrl, setMusicUrl] = useState("");
    
    const [muteOriginalVideo, setMuteOriginalVideo] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const mediaInputRef = useRef(null);
    const progressInterval = useRef(null);

    useEffect(() => {
        fetchStatuses();
        return () => stopCameraStreams();
    }, []);

    // Instantly refetch statuses when a friend posts a new one
    useEffect(() => {
        if (!socket) return;
        const handleInstantStatus = () => fetchStatuses();
        socket.on("status:new", handleInstantStatus);
        return () => socket.off("status:new", handleInstantStatus);
    }, [socket]);

    const fetchStatuses = async () => {
        try {
            const { data } = await axiosInstance.get("/statuses/feed");
            const sortedFeed = data.statusFeed.map(group => ({
                ...group,
                statuses: group.statuses.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            }));
            
            setMyStatusGroup(sortedFeed.find(group => group.user._id === user._id) || null);
            setFriendsStatuses(sortedFeed.filter(group => group.user._id !== user._id));
        } catch (error) { 
            console.error("Failed to fetch statuses", error); 
        }
    };

    useEffect(() => {
        if (activeStoryGroup && !showViewers) {
            const currentStatus = activeStoryGroup.statuses[activeStoryIndex];
            if (activeStoryGroup.user._id !== user._id) {
                axiosInstance.post(`/statuses/view/${currentStatus._id}`).catch(()=> {});
            }
            progressInterval.current = setInterval(handleNextStory, 5000);
        }
        return () => clearInterval(progressInterval.current);
    }, [activeStoryGroup, activeStoryIndex, showViewers]);

    const handleNextStory = () => {
        if (!activeStoryGroup) return;
        if (activeStoryIndex < activeStoryGroup.statuses.length - 1) {
            setActiveStoryIndex(prev => prev + 1);
        } else {
            closeViewer();
        }
    };

    const handlePrevStory = () => {
        if (!activeStoryGroup) return;
        if (activeStoryIndex > 0) {
            setActiveStoryIndex(prev => prev - 1);
        } else {
            clearInterval(progressInterval.current);
            progressInterval.current = setInterval(handleNextStory, 5000);
        }
    };

    const openViewer = (group) => { 
        setActiveStoryGroup(group); 
        setActiveStoryIndex(0); 
    };

    const closeViewer = () => {
        setActiveStoryGroup(null);
        setActiveStoryIndex(0);
        setShowViewers(false);
        clearInterval(progressInterval.current);
        fetchStatuses(); 
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setIsCameraOpen(true);
            setTimeout(() => {
                if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
            }, 100);
        } catch (err) {
            toast.error("Camera access denied or unavailable");
        }
    };

    const stopCameraStreams = () => {
        if (liveVideoRef.current?.srcObject) {
            liveVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    const closeCamera = () => {
        stopCameraStreams();
        setIsCameraOpen(false);
        setIsRecording(false);
    };

    const toggleRecording = () => {
        if (isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        } else {
            recordedChunksRef.current = [];
            const stream = liveVideoRef.current.srcObject;
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
            
            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };
            
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
                const file = new File([blob], "recorded-status.webm", { type: "video/webm" });
                setSelectedMedia(file);
                setPreviewMediaUrl(URL.createObjectURL(file));
                closeCamera();
                setIsCreating(true); 
            };
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
        }
    };

    const handleMediaSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) return toast.error("Media must be < 15MB");
        setSelectedMedia(file);
        setPreviewMediaUrl(URL.createObjectURL(file));
    };

    const handleCreateStatus = async () => {
        if (!statusText.trim() && !selectedMedia) return toast.error("Add media or text");
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("text", statusText);
            formData.append("musicTitle", musicTitle);
            formData.append("musicUrl", musicUrl);
            if (selectedMedia) formData.append("media", selectedMedia);

            await axiosInstance.post("/statuses/create", formData, { 
                headers: { "Content-Type": "multipart/form-data" } 
            });
            
            toast.success("Status updated!");
            resetCreationState();
            fetchStatuses();
        } catch (error) { 
            toast.error("Failed to update status"); 
        } finally { 
            setLoading(false); 
        }
    };

    const resetCreationState = () => {
        setStatusText("");
        setSelectedMedia(null);
        setPreviewMediaUrl(null);
        setMusicTitle("");
        setMusicUrl("");
        setShowMusicInput(false);
        setMuteOriginalVideo(false);
        setIsCreating(false);
    };

    if (isCameraOpen) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in duration-200">
                <div className="absolute top-6 w-full px-6 flex justify-between items-center z-50">
                    <button onClick={closeCamera} className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition">
                        <FiX size={24} />
                    </button>
                    {isRecording && (
                        <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/50">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-red-500 text-xs font-bold tracking-widest uppercase">REC</span>
                        </div>
                    )}
                </div>
                <div className="flex-1 relative w-full flex items-center justify-center bg-zinc-900">
                    <video ref={liveVideoRef} autoPlay playsInline muted className="w-full h-full sm:h-[90vh] sm:max-w-md object-contain bg-black" />
                </div>
                <div className="absolute bottom-10 w-full flex justify-center z-50">
                    <button onClick={toggleRecording} className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${isRecording ? 'border-red-500 scale-110' : 'border-white hover:scale-105'}`}>
                        <div className={`transition-all duration-300 ${isRecording ? 'w-8 h-8 bg-red-500 rounded-lg' : 'w-16 h-16 bg-white rounded-full'}`}></div>
                    </button>
                </div>
            </div>
        );
    }

    if (activeStoryGroup) {
        const currentStatus = activeStoryGroup.statuses[activeStoryIndex];
        const isMyStatus = activeStoryGroup.user._id === user._id;
        const hasMusic = !!currentStatus.musicUrl;
        const hasMusicTitle = !!currentStatus.musicTitle;

        return (
            <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-in fade-in duration-200">
                <div className="relative w-full h-full sm:h-[90vh] sm:max-w-md sm:rounded-xl bg-black overflow-hidden shadow-2xl flex flex-col">
                    <div className="flex gap-1 p-3 w-full absolute top-0 z-50">
                        {activeStoryGroup.statuses.map((s, i) => (
                            <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                <div className={`h-full bg-white transition-all ease-linear ${i < activeStoryIndex ? 'w-full' : i === activeStoryIndex && !showViewers ? 'w-full animate-[progress_5s_linear]' : 'w-0'}`} style={{ animationPlayState: showViewers ? 'paused' : 'running' }}></div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute top-6 w-full px-4 flex items-center justify-between z-50">
                        <div className="flex items-center gap-3">
                            <img src={activeStoryGroup.user.profilePic || `https://ui-avatars.com/api/?name=${activeStoryGroup.user.fullName}`} className="w-10 h-10 rounded-full border border-white/20 object-cover shadow-sm" alt="Profile" />
                            <div>
                                <h3 className="text-white font-medium text-sm drop-shadow-md">{activeStoryGroup.user.fullName}</h3>
                                <p className="text-white/80 text-xs drop-shadow-md">{new Date(currentStatus.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                        <button onClick={closeViewer} className="text-white hover:bg-white/20 p-2 rounded-full transition"><FiX size={22} /></button>
                    </div>
                    {hasMusicTitle && (
                        <div className="absolute top-20 left-4 z-50 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 max-w-[180px] shadow-lg border border-white/10">
                            <FiMusic className="text-white shrink-0" size={12} />
                            <div className="overflow-hidden w-full relative">
                                <p className="text-white text-xs font-medium whitespace-nowrap animate-marquee">
                                    {currentStatus.musicTitle} • {currentStatus.musicTitle}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="flex-1 relative flex items-center justify-center bg-black">
                        <div className="absolute left-0 w-1/3 h-full z-40 cursor-pointer" onClick={handlePrevStory}></div>
                        <div className="absolute right-0 w-2/3 h-full z-40 cursor-pointer" onClick={handleNextStory}></div>
                        {currentStatus.mediaUrl ? (
                            currentStatus.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video src={currentStatus.mediaUrl} autoPlay playsInline muted={hasMusic} className="w-full h-full object-contain" />
                            ) : (
                                <img src={currentStatus.mediaUrl} className="w-full h-full object-contain" alt="Status" />
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-tr from-slate-800 to-zinc-900">
                                <h2 className="text-white text-2xl font-medium text-center leading-relaxed drop-shadow-md">{currentStatus.text}</h2>
                            </div>
                        )}
                        {hasMusic && <audio src={currentStatus.musicUrl} autoPlay loop />}
                        {currentStatus.mediaUrl && currentStatus.text && (
                            <div className="absolute bottom-20 w-full text-center z-50 pointer-events-none px-4">
                                <span className="bg-black/60 text-white px-5 py-2.5 rounded-2xl text-sm backdrop-blur-md inline-block max-w-full truncate whitespace-break-spaces shadow-lg border border-white/10">
                                    {currentStatus.text}
                                </span>
                            </div>
                        )}
                    </div>
                    {isMyStatus && (
                        <div className="absolute bottom-6 w-full flex flex-col items-center z-50">
                            <button onClick={() => setShowViewers(!showViewers)} className="flex items-center gap-2 bg-black/60 text-white px-4 py-1.5 rounded-full backdrop-blur-md text-xs font-medium hover:bg-black/80 transition border border-white/10">
                                <FiEye size={14} /> {currentStatus.viewers?.length || 0}
                            </button>
                            {showViewers && (
                                <div className="absolute bottom-12 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-2 border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-3 border-b dark:border-slate-800 pb-2">
                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">Viewers</h3>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-3">
                                        {currentStatus.viewers?.length === 0 ? (
                                            <p className="text-center text-slate-500 text-xs py-4">No views yet</p>
                                        ) : (
                                            currentStatus.viewers?.map(v => (
                                                <div key={v._id} className="flex items-center gap-3">
                                                    <img src={v.profilePic || `https://ui-avatars.com/api/?name=${v.fullName}`} className="w-8 h-8 rounded-full object-cover bg-slate-200" alt="Viewer" />
                                                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{v.fullName}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <style>{`
                    @keyframes progress { from { width: 0%; } to { width: 100%; } }
                    @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
                    .animate-marquee { display: inline-block; animation: marquee 6s linear infinite; }
                `}</style>
            </div>
        );
    }

    if (isCreating) {
        return (
            <div className="flex flex-col h-full bg-[#111B21] animate-in slide-in-from-bottom-4 duration-300 relative">
                <div className="flex items-center justify-between p-4 z-10 bg-black/40 backdrop-blur-md absolute top-0 w-full">
                    <button onClick={resetCreationState} className="text-white p-2 rounded-full hover:bg-white/10 transition"><FiX size={22} /></button>
                    <h2 className="text-white font-medium">New Status</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setShowMusicInput(!showMusicInput)} className={`p-2 rounded-full transition ${musicTitle ? "text-indigo-400 bg-white/10" : "text-white hover:bg-white/10"}`} title="Add Music">
                            <FiMusic size={20} />
                        </button>
                        <button onClick={() => mediaInputRef.current?.click()} className="text-white p-2 rounded-full hover:bg-white/10 transition" title="Upload Media from Gallery">
                            <FiImage size={20} />
                        </button>
                        <button onClick={startCamera} className="text-white p-2 rounded-full hover:bg-white/10 transition" title="Record Video">
                            <FiVideo size={20} />
                        </button>
                    </div>
                    <input type="file" ref={mediaInputRef} hidden accept="image/*,video/*" onChange={handleMediaSelect} />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20 pb-20 relative bg-black">
                    {showMusicInput && (
                        <div className="absolute top-20 left-4 right-4 z-50 bg-black/70 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-4">
                            <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2"><FiMusic /> Add Soundtrack</h3>
                            <input type="text" value={musicTitle} onChange={(e) => setMusicTitle(e.target.value)} placeholder="Song Title & Artist (e.g. Love You Zindagi)" className="w-full bg-white/10 text-white placeholder-white/40 text-sm px-4 py-2.5 rounded-lg outline-none mb-3 border border-white/5 focus:border-indigo-500/50 transition" />
                            <div className="flex items-center bg-white/10 rounded-lg px-4 border border-white/5 focus-within:border-indigo-500/50 transition">
                                <FiLink className="text-white/40" />
                                <input type="text" value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} placeholder="Direct Audio URL (must end in .mp3)" className="w-full bg-transparent text-white placeholder-white/40 text-sm px-3 py-2.5 outline-none" />
                            </div>
                        </div>
                    )}
                    {previewMediaUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl bg-black">
                            {selectedMedia.type.startsWith('video/') ? (
                                <>
                                    <video src={previewMediaUrl} autoPlay loop playsInline muted={muteOriginalVideo || !!musicUrl} className="w-full h-full object-contain" />
                                    <button onClick={() => setMuteOriginalVideo(!muteOriginalVideo)} className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition ${muteOriginalVideo ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}>
                                        <FiVideoOff size={18} />
                                    </button>
                                </>
                            ) : (
                                <img src={previewMediaUrl} alt="Preview" className="w-full h-full object-contain" />
                            )}
                            {musicTitle && (
                                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/10">
                                    <FiMusic className="text-white" size={12} />
                                    <p className="text-white text-xs font-medium max-w-[120px] truncate">{musicTitle}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <textarea autoFocus value={statusText} onChange={(e) => setStatusText(e.target.value)} placeholder="Type a status..." className="w-full max-w-md bg-transparent text-center text-3xl font-medium text-white resize-none outline-none placeholder-white/30 h-full flex items-center justify-center" />
                    )}
                </div>
                <div className="absolute bottom-0 w-full p-4 bg-black/40 backdrop-blur-md flex items-center gap-3">
                    <input type="text" value={statusText} onChange={(e) => setStatusText(e.target.value)} placeholder="Add a caption..." className="flex-1 bg-white/10 text-white placeholder-white/50 px-4 py-3 rounded-full text-sm outline-none border border-white/10 focus:bg-white/20 transition" />
                    <button disabled={loading || (!statusText.trim() && !selectedMedia)} onClick={handleCreateStatus} className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition shrink-0 disabled:opacity-50">
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSend size={18} className="translate-x-0.5" />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Status</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/60">
                    {myStatusGroup ? (
                        <div onClick={() => openViewer(myStatusGroup)} className="w-full flex items-center gap-4 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl cursor-pointer transition">
                            <div className="p-[2px] bg-gradient-to-tr from-slate-300 to-slate-400 rounded-full">
                                <img src={myProfilePic} className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-900 object-cover" alt="My Status" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-medium text-slate-800 dark:text-slate-100">My Status</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{myStatusGroup.statuses.length} updates today</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setIsCreating(true); }} className="p-2.5 text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition">
                                <FiPlus size={20} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsCreating(true)} className="w-full flex items-center gap-4 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl transition group text-left">
                            <div className="relative shrink-0">
                                <img src={myProfilePic} className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700" alt="My Status" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-600 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white"><FiPlus size={10} /></div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-slate-800 dark:text-slate-100">My Status</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click to add status update</p>
                            </div>
                        </button>
                    )}
                </div>

                <div className="p-4">
                    <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Recent Updates</h3>
                    {friendsStatuses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-8 mt-4">
                            <FiCircle size={32} className="text-slate-200 dark:text-slate-700 mb-3" />
                            <p className="text-sm text-slate-400 dark:text-slate-500">No recent updates</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {friendsStatuses.map((feedItem) => (
                                <div key={feedItem.user._id} onClick={() => openViewer(feedItem)} className="flex items-center gap-4 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl cursor-pointer transition">
                                    <div className="p-[2px] bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-full">
                                        <img src={feedItem.user.profilePic || `https://ui-avatars.com/api/?name=${feedItem.user.fullName}`} className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-900 object-cover" alt="status profile" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-800 dark:text-slate-100">{feedItem.user.fullName}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{feedItem.statuses.length} new updates</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}