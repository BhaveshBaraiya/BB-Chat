import {
  FiMessageSquare,
  FiCircle,
  FiUsers,
  FiSettings
} from "react-icons/fi";
import { useSelector } from "react-redux";

export default function LeftRail({ activeTab, setActiveTab }) {
  // Pulling authUser from Redux to ensure it is reactive across the app
  const authUser = useSelector((state) => state.auth.user);

  const tabs = [
    { id: "chats", icon: <FiMessageSquare /> },
    { id: "status", icon: <FiCircle /> },
    { id: "communities", icon: <FiUsers /> },
    { id: "settings", icon: <FiSettings /> }
  ];

  return (
    <div className="
      w-full h-full bg-[#202C33] 
      flex flex-row lg:flex-col 
      items-center justify-between 
      px-4 lg:px-0 py-2 lg:py-5
    ">
      {/* Navigation Tabs Container */}
      <div className="flex flex-row lg:flex-col gap-2 lg:gap-4 w-full lg:w-auto justify-around lg:justify-start">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors
              ${activeTab === tab.id 
                ? "bg-[#374248] text-green-400" 
                : "text-gray-400 hover:text-white"
              }
            `}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* User Profile Avatar */}
      <div className="hidden lg:block">
        <img
          src={authUser?.profilePic || `https://ui-avatars.com/api/?name=${authUser?.fullName || "User"}`}
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-600 cursor-pointer"
          alt="Profile"
        />
      </div>
    </div>
  );
}