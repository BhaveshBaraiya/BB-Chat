import { useState, useCallback, useRef } from "react";
import axiosInstance from "../services/axios";

export default function useSearchUsers() {
    const [users, setUsers] = useState([]);
    const abortControllerRef = useRef(null);

    const searchUsers = useCallback(async (query) => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();

        try {
            const { data } = await axiosInstance.get(`/users/search?q=${query}`, {
                signal: abortControllerRef.current.signal
            });
            setUsers(data);
        } catch (err) {
            if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
                console.log("search failed:", err.response?.data || err);
            }
        }
    }, []);

    return { users, searchUsers };
}