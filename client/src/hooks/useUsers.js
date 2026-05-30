import { useEffect, useState } from "react";
import axiosInstance from "../services/axios";

export default function useUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUsers = async () => {
            try {
                // Hitting the combined endpoint for the sidebar
                const { data } = await axiosInstance.get("/friends/sidebar-users");
                setUsers(data.users);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        getUsers();
    }, []);

    return { users, loading };
}