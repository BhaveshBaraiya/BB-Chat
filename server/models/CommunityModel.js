import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        avatar: {
            type: String,
            default: ""
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        }
    },
    { timestamps: true }
);

export default mongoose.model("Community", communitySchema);