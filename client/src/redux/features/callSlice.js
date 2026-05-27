import { createSlice } from '@reduxjs/toolkit';

const callSlice = createSlice({
    name: 'call',
    initialState:{
        isReceivingCall:false,
        from:null,
        type:null,
        active:false,
        stream:null,
        peerId:null,
        remoteName:null,
        remotePic:null
    },
    reducers: {
        setCallState: (state, action) => {
            return { ...state, ...action.payload };
        },
        endCall: (state) => {
            state.isReceivingCall=false;
            state.from=null;
            state.type=null;
            state.active=false;
            state.peerId=null;
            state.stream=null;
            state.remoteName=null;
            state.remotePic=null;
        },
    }
});

export const { setCallState, endCall } = callSlice.actions;
export default callSlice.reducer;