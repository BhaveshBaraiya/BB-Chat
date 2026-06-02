import { useEffect, useState } from "react";
import axiosInstance from "../services/axios";

export default function useUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const getUsers = async () => {
            try {
                const { data } = await axiosInstance.get("/friends/sidebar-users");
                if (isMounted) setUsers(data.users);
            } catch (error) {
                if (isMounted) console.log(error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        getUsers();

        return () => {
            isMounted = false;
        };
    }, []);

    return { users, loading };
}