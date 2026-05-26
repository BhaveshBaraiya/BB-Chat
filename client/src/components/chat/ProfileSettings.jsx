import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import useUpdateProfile from "../../hooks/useUpdateProfile";
import { FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ProfileSettings({ goBack }) {

    const { user } = useContext(AuthContext);
    const { updateProfile } = useUpdateProfile();

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

            if (profilePic) {
                formData.append("profilePic", profilePic);
            }

            await updateProfile(formData);

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

            <button
                onClick={goBack}
                className="mb-5 flex items-center gap-2"
            >
                <FiArrowLeft />
                Back
            </button>

            <h2 className="text-xl font-semibold mb-5">
                Edit Profile
            </h2>

            {/* IMAGE */}
            <div className="flex justify-center mb-5">
                <label className="cursor-pointer">
                    <img
                        src={
                            preview ||
                            `https://ui-avatars.com/api/?name=${user?.fullName}`
                        }
                        className="w-28 h-28 rounded-full object-cover"
                        alt="profile"
                    />
                    <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                </label>
            </div>

            {/* NAME */}
            <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full border p-3 rounded-xl mb-3"
            />

            {/* BIO */}
            <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="About"
                className="w-full border p-3 rounded-xl h-[120px]"
            />

            {/* SAVE */}
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