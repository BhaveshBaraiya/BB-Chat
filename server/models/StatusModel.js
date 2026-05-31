import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        mediaUrl: { type: String, default: "" },
        text: { type: String, default: "" },
        musicUrl: { type: String, default: "" },
        musicTitle: { type: String, default: "" },
        viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        hiddenStatusUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    { timestamps: true }
);

statusSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
export default mongoose.model("Status", statusSchema);