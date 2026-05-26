import { useState } from "react";
import axiosInstance from "../services/axios";

export default function useSearchUsers() {

    const [users, setUsers] = useState([]);

   const searchUsers = async(query)=>{

console.log("searching:",query);

if(!query.trim()){

setUsers([]);
return;

}

try{

const {data}=await axiosInstance.get(
`/users/search?q=${query}`
);

console.log("users:",data);

setUsers(data);

}
catch(err){

console.log(
"search failed:",
err.response?.data || err
);

}

}

    return {
        users,
        searchUsers
    }

}