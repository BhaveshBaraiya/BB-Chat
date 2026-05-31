import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        selectedChat: null,
        replyMessage: null,
        messages: [],
        typingUsers: [],
        forwardMessageData: null,
        unreadCounts: {},
    },
    reducers: {
        setSelectedChat: (state, action) => { state.selectedChat = action.payload; },
        setReplyMessage: (state, action) => { state.replyMessage = action.payload; },
        setForwardMessageData: (state, action) => { state.forwardMessageData = action.payload; },
        setMessages: (state, action) => { state.messages = action.payload; },
        togglePinnedMessage: (state, action) => {
            const msg = state.messages.find(
                m => m._id === action.payload
            );

            if (msg) {
                msg.pinned = !msg.pinned;
            }
        },
        
        addMessage: (state, action) => {
            if (!state.messages.some(m => m._id === action.payload._id)) {
                state.messages.push(action.payload);
            }
        },
        incrementUnreadCount: (state, action) => {
            const senderId = action.payload;
            state.unreadCounts[senderId] = (state.unreadCounts[senderId] || 0) + 1;
        },
        clearUnreadCount: (state, action) => {
            delete state.unreadCounts[action.payload];
        },
        updateMessageStatus: (state, action) => {
            const { id, status } = action.payload;
            const msg = state.messages.find(m => m._id === id);
            if (msg) msg[status] = true;
        },
        updateMessageReaction: (state, action) => {
            const index = state.messages.findIndex(m => m._id === action.payload._id);
            if (index !== -1) state.messages[index] = action.payload;
        },
        addTypingUser: (state, action) => {
            if (!state.typingUsers.includes(action.payload)) {
                state.typingUsers.push(action.payload);
            }
        },
        removeTypingUser: (state, action) => {
            state.typingUsers = state.typingUsers.filter(id => id !== action.payload);
        },
        updateChatUser: (state, action) => {
            if (state.selectedChat && state.selectedChat._id === action.payload._id) {
                state.selectedChat = { ...state.selectedChat, ...action.payload };
            }
        },
        removeMessage: (state, action) => {
            state.messages = state.messages.filter(msg => msg._id !== action.payload);
        },
        markMessageDeletedForAll: (state, action) => {
            const msg = state.messages.find(m => m._id === action.payload);
            if (msg) {
                msg.text = "";
                msg.isDeletedForEveryone = true;
            }
        },

        updateMessage: (state, action) => {
    const index = state.messages.findIndex(
        m => m._id === action.payload._id
    );

    if (index !== -1) {
        state.messages[index] = action.payload;
    }
},

updatePinnedMessage: (state, action) => {
    const index = state.messages.findIndex(
        m => m._id === action.payload._id
    );

    if (index !== -1) {
        state.messages[index] = action.payload;
    }
},
    }
});

export const { 
    setSelectedChat, setReplyMessage, setForwardMessageData, setMessages, 
    addMessage, incrementUnreadCount, clearUnreadCount, updateMessageStatus, 
    updateMessageReaction, addTypingUser, removeTypingUser, updateChatUser, removeMessage, markMessageDeletedForAll, togglePinnedMessage
} = chatSlice.actions;

export default chatSlice.reducer;