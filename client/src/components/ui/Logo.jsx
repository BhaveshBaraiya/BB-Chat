import React, { useContext } from 'react'
import { ThemeContext } from "../../context/ThemeContext";
import logoLight from "/assets/logo.png";
import logoDark from "/assets/logo-dark.png";

function Logo() {
    const { theme } = useContext(ThemeContext);
    return (
        <div className="mb-4">
            <img
                src={theme === "dark" ? logoDark : logoLight}
                alt="BBChat"
                className="w-35 h-35 object-contain"
            />
        </div>
    )
}

export default Logo
