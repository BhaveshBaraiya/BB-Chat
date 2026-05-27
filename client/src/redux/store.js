import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import chatReducer from './features/chatSlice';
import callReducer from './features/callSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        call: callReducer,
    },
    // Prevent Redux from throwing errors if non-serializable socket/RTC data slips in
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});