import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../services/axios";
import { setMessages, prependMessages } from "../redux/features/chatSlice";

export default function useMessages() {
    const dispatch = useDispatch();
    const selectedChat = useSelector((state) => state.chat.selectedChat);
    const messages = useSelector((state) => state.chat.messages);

    const [loading, setLoading] = useState(false);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    useEffect(() => {
        if (!selectedChat?._id) return;
        
        let isMounted = true;

        const fetchInitialMessages = async () => {
            dispatch(setMessages([]));
            setLoading(true);
            setPage(1);
            setHasMore(true);

            try {        
                const { data } = await axiosInstance.get(
                    `/messages/${selectedChat._id}?limit=50&page=1`
                );
                
                if (isMounted) {
                    dispatch(setMessages(data.messages));                
                    if (data.messages.length < 50) setHasMore(false);
                }
            } catch (error) {
                if (isMounted) console.log(error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchInitialMessages();
        
        return () => {
            isMounted = false;
        };
    }, [selectedChat?._id, dispatch]);
    
    const fetchMoreMessages = useCallback(async () => {
        if (fetchingMore || !hasMore || !selectedChat?._id) return;

        setFetchingMore(true);
        const nextPage = page + 1;

        try {
            const { data } = await axiosInstance.get(
                `/messages/${selectedChat._id}?limit=50&page=${nextPage}`
            );

            if (data.messages.length > 0) {
                dispatch(prependMessages(data.messages));
                setPage(nextPage);
            }
            
            if (data.messages.length < 50) {
                setHasMore(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setFetchingMore(false);
        }
    }, [page, hasMore, fetchingMore, selectedChat?._id, dispatch]);

    return { messages, loading, fetchMoreMessages, hasMore, fetchingMore };
}