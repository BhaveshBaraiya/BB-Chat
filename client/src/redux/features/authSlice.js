import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from "../../services/axios";

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get("/auth/me");
        return data.user;
    } catch(error){
        if(error.response?.status === 401){
            return rejectWithValue("UNAUTHORIZED"); 
        }
        return rejectWithValue(
            error.response?.data?.message || "Failed to fetch user"
        );
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: true,
    },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.loading = false;
        },
        updateUser: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        logout: (state) => {
            state.user = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.loading = false;
            })
            .addCase(fetchCurrentUser.rejected, (state) => {
                state.user = null;
                state.loading = false;
            });
    }
});

export const { setUser, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;