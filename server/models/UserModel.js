import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        profilePic: {
            type: String,
            default: ""
        },

        bio:{
        type:String,
        default:"Hey there! I am using MERN Chat"
        },
        blockedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: []
            }
        ],
        globalNotificationsMuted: { 
            type: Boolean, 
            default: false 
        },
        mutedChats: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }],
    },
    {
        timestamps: true
    }
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;