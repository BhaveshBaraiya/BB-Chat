import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../../redux/features/authSlice"; 
import axiosInstance from "../../services/axios";
import { FiArrowLeft, FiCamera } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ProfileSettings({ goBack }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user); 

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setBio(user.bio || "");
      setPreview(user.profilePic || null);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfilePic(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("bio", bio);
      if (profilePic) formData.append("profilePic", profilePic);

      const { data } = await axiosInstance.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      dispatch(updateUser(data)); 
      setProfilePic(null);
      toast.success("Profile updated successfully 🚀");
      goBack?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] sm:h-full flex flex-col bg-white overflow-hidden">
      
      {/* FIXED HEADER */}
      <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-slate-100 shrink-0">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition text-slate-600">
          <FiArrowLeft size={20} />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Edit Profile</h2>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      {/* Added pb-12 so the scroll doesn't stop abruptly at the button */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-12">
        <div className="max-w-xl mx-auto w-full">
          
          {/* Avatar Section */}
          <div className="flex justify-center mb-8 mt-2">
            <label className="cursor-pointer relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={preview || `https://ui-avatars.com/api/?name=${user?.fullName}`}
                  className="w-full h-full object-cover bg-slate-100"
                  alt="profile"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <FiCamera className="text-white text-2xl" />
              </div>
              <input type="file" hidden accept="image/*" onChange={handleImageChange} />
            </label>
          </div>

          {/* Inputs Section */}
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Enter your name" 
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl mt-1.5 focus:ring-2 focus:ring-indigo-500 outline-none transition text-slate-800 font-medium" 
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">About</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="Tell us about yourself" 
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl mt-1.5 focus:ring-2 focus:ring-indigo-500 outline-none transition text-slate-800 h-[120px] resize-none" 
              />
            </div>
          </div>
          <div className="my-8">
            <button 
              onClick={save} 
              disabled={loading} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}