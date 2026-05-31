import mongoose from "mongoose";

const messageSchema = new mongoose.Schema( {
        senderId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },

        receiverId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },

        text:{
            type:String,
            default:""
        },

        images:{
        type:[String],
        default:[]
        },

        documents:[
        {
        fileUrl:String,
        fileName:String,
        fileSize:String
        }
        ],
        isForwarded: {
            type: Boolean,
            default: false
        },
        audio:{
        type:String,
        default:""
        },
        delivered: {
            type:Boolean,
            default:false
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null // 
        },
        communityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Community",
            default: null
        },
        replyTo:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Message",
            default:null
        },

        reactions:[
        {
            userId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            },

            emoji:{
                type:String
            }
        }
    ],

    edited:{
        type:Boolean,
        default:false
    },

    pinned:{
        type:Boolean,
        default:false
    },

    pinnedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:null
    },

    deletedFor:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"User",
        default:[]
    },

    isDeletedForEveryone:{
        type:Boolean,
        default:false
    },

        seen:{
            type:Boolean,
            default:false
        }
    },
    {
        timestamps:true
    }
);

const MessageModel= mongoose.model("Message", messageSchema);

export default MessageModel;