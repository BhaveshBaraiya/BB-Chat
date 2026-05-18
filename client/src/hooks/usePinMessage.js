import axiosInstance from "../services/axios";

export default function usePinMessage(){
    const pinMessage = async(messageId) => {
        try {
            await axiosInstance.put(`/messages/pin/${messageId}`);
        } catch(error){
            console.log(error);
        }
    };
    return { pinMessage };
}