import { useState } from "react";
import axiosInstance from "../services/axios";

export default function useSearchUsers() {
    const [users, setUsers] = useState([]);
    const searchUsers = async (query) => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }

        try {
            const { data } = await axiosInstance.get(`/users/search?q=${query}`);
            setUsers(data);
        }
        catch (err) {
            console.log("search failed:", err.response?.data || err);
        }
    }

    return { users, searchUsers }
}