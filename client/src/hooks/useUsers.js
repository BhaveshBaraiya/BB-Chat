import { useEffect, useState } from "react";

import axiosInstance from "../services/axios";

export default function useUsers() {

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        const getUsers= async()=> {
            try {
                const {data} = await axiosInstance.get("/users");
                setUsers(data.users);
            }

            catch(error){
                console.log(error);
            }

            finally{
                setLoading(false);
            }
        };

        getUsers();

    },[]);

    return { users, loading };
}