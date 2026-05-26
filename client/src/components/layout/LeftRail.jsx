import {
    FiMessageSquare,
    FiCircle,
    FiUsers,
    FiSettings
} from "react-icons/fi";

export default function LeftRail({
    activeTab,
    setActiveTab,
    authUser
}) {

    const tabs = [

        {
            id: "chats",
            icon: <FiMessageSquare />
        },

        {
            id: "status",
            icon: <FiCircle />
        },

        {
            id: "communities",
            icon: <FiUsers />
        },

        {
            id: "settings",
            icon: <FiSettings />
        }

    ];

    return (

        <div className="
w-[70px]
bg-[#202C33]
h-screen
flex
flex-col
items-center
justify-between
py-5
">

            <div className="space-y-4">

                {
                    tabs.map(tab => (

                        <button
                            key={tab.id}
                            onClick={() =>
                                setActiveTab(tab.id)
                            }
                            className={`
w-12
h-12
rounded-xl
flex
items-center
justify-center
text-xl

${activeTab === tab.id

                                    ?

                                    "bg-[#374248] text-green-400"

                                    :

                                    "text-gray-400"
                                }
`}
                        >

                            {tab.icon}

                        </button>

                    ))
                }

            </div>


            <img
                src={
                    authUser?.profilePic ||

                    `https://ui-avatars.com/api/?name=${authUser?.fullName}`
                }
                className="
w-10
h-10
rounded-full
"
            />

        </div>

    )

}