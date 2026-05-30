import {
  FiMessageSquare,
  FiCircle,
  FiUsers,
  FiSettings,
  FiUserPlus
} from "react-icons/fi";
import { useSelector } from "react-redux";

export default function LeftRail({ activeTab, setActiveTab, pendingCount }) {
  const authUser = useSelector((state) => state.auth.user);

  const tabs = [
    { id: "chats", icon: <FiMessageSquare /> },
    { id: "status", icon: <FiCircle /> },
    { id: "friends", icon: <FiUserPlus /> },
    { id: "communities", icon: <FiUsers /> },
    { id: "settings", icon: <FiSettings /> }
  ];

  return (
    <div className="
      w-full h-full bg-[#202C33] 
      flex flex-row lg:flex-col 
      items-center justify-between 
      px-4 lg:px-0 py-2 lg:py-5
      min-w-[80px]
    ">
      <div className="flex flex-row lg:flex-col gap-2 lg:gap-4 w-full lg:w-auto justify-around lg:justify-start">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors
              ${activeTab === tab.id 
                ? "bg-[#374248] text-green-400" 
                : "text-gray-400 hover:text-white"
              }
            `}
          >
            {tab.icon}
            
            {tab.id === "friends" && pendingCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#202C33]"></span>
            )}
          </button>
        ))}
      </div>  
    </div>
  );
}