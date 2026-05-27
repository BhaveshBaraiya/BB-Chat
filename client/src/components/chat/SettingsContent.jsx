import { useState } from "react";

import ProfileSettings from "./ProfileSettings";
import LogoutButton from "./LogoutButton";

export default function SettingsContent() {

    const [active, setActive] = useState("");

    if (active === "profile") {
        return (
            <ProfileSettings
                goBack={() => setActive("")}
            />
        )
    }

    return (

        <div className="p-5">

            <h1 className="
text-2xl
font-bold
mb-6
">

                Settings

            </h1>

            <div className="space-y-3">

                <button
                    onClick={() =>
                        setActive("profile")
                    }
                    className="
w-full
p-4
bg-slate-100
rounded-xl
text-left
hover:bg-slate-200
"
                >

                    Profile

                </button>


                <button
                    className="
w-full
p-4
bg-slate-100
rounded-xl
text-left
hover:bg-slate-200
"
                >

                    Privacy

                </button>


                <button
                    className="
w-full
p-4
bg-slate-100
rounded-xl
text-left
hover:bg-slate-200
"
                >

                    Theme

                </button>


                <div className="pt-5">

                    <LogoutButton />

                </div>

            </div>

        </div>

    )

}