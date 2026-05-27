import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../../redux/features/authSlice"; 
import axiosInstance from "../../services/axios";
import { FiArrowLeft } from "react-icons/fi";
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

      // Update Redux state to trigger global UI updates
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
    <div className="p-5">
      <button onClick={goBack} className="mb-5 flex items-center gap-2">
        <FiArrowLeft /> Back
      </button>
      <h2 className="text-xl font-semibold mb-5">Edit Profile</h2>

      <div className="flex justify-center mb-5">
        <label className="cursor-pointer">
          <img
            src={preview || `https://ui-avatars.com/api/?name=${user?.fullName}`}
            className="w-28 h-28 rounded-full object-cover"
            alt="profile"
          />
          <input type="file" hidden accept="image/*" onChange={handleImageChange} />
        </label>
      </div>

      <input 
        value={fullName} 
        onChange={(e) => setFullName(e.target.value)} 
        placeholder="Full Name" 
        className="w-full border p-3 rounded-xl mb-3" 
      />
      <textarea 
        value={bio} 
        onChange={(e) => setBio(e.target.value)} 
        placeholder="About" 
        className="w-full border p-3 rounded-xl h-[120px]" 
      />

      {/* MOBILE EXTRA SETTINGS */}
      <div className="lg:hidden mt-8">
        <h3 className="font-semibold text-slate-700 mb-4">More Settings</h3>
        <div className="space-y-3">
          {["Notifications", "Shared Media", "Groups", "Privacy"].map((item) => (
            <div key={item} className="bg-white p-4 rounded-xl shadow-sm">
              {item}
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={save} 
        disabled={loading} 
        className="mt-4 w-full bg-green-500 text-white py-3 rounded-xl"
      >
        {loading ? "Updating..." : "Save Changes"}
      </button>
    </div>
  );
}