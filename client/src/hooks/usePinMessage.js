import { useDispatch } from "react-redux";
import axiosInstance from "../services/axios";
import { togglePinnedMessage } from "../redux/features/chatSlice";

export default function usePinMessage() {

    const dispatch = useDispatch();

    const pinMessage = async (messageId) => {
        try {

            await axiosInstance.put(
                `/messages/pin/${messageId}`
            );

            dispatch(
                togglePinnedMessage(messageId)
            );

        } catch (error) {
            console.log(error);
        }
    };

    return { pinMessage };
}