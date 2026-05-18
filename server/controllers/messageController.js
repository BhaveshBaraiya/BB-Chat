import MessageModel from "../models/MessageModel.js";
import mongoose from "mongoose";
import {
    io,
    userSocketMap
} from "../socket/socket.js";

export const getMessages = async (req, res) => {
    try {

        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages=await MessageModel.find({
                $or:[

                    {
                        senderId:myId,
                        receiverId:userToChatId
                    },

                    {
                        senderId:userToChatId,
                        receiverId:myId
                    }

                ],

                deletedFor:{
                    $ne:myId
                }

            })
            .populate(
                "replyTo"
            );

        res.status(200).json({
            success: true,
            messages
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

export const sendMessage = async(req,res)=>{

    try{

        const { 
            text,
            replyTo
        } = req.body;

        const {
            id:receiverId
        } = req.params;

        const senderId =
            req.user._id;


        const receiverSocketId=
            userSocketMap.get(
                receiverId.toString()
            );


        const newMessage=
            await MessageModel.create({

                senderId,
                receiverId,

                text,

                replyTo:
                    replyTo || null,

                delivered:
                    !!receiverSocketId,

                seen:false

            });


        // populate reply message
        const populatedMessage =
            await MessageModel
            .findById(
                newMessage._id
            )
            .populate(
                "replyTo",
                "text senderId"
            );


        if(receiverSocketId){

            io.to(
                receiverSocketId
            ).emit(
                "newMessage",
                populatedMessage
            );

        }


        res.status(201).json({

            success:true,

            message:
                populatedMessage

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

export const getUnreadCounts = async(req,res)=>{

    try{

        const myId =
            new mongoose.Types.ObjectId(
                req.user._id
            );

        const unread =
            await MessageModel.aggregate([

            {
                $match:{
                    receiverId:myId,
                    seen:false
                }
            },

            {
                $group:{
                    _id:"$senderId",
                    count:{
                        $sum:1
                    }
                }
            }

        ]);

        const counts={};

        unread.forEach(item=>{

            counts[
                item._id.toString()
            ]=item.count;

        });

        res.status(200).json({

            success:true,
            counts

        });

    }

    catch(error){

        console.log(
            "Unread Error:",
            error
        );

        res.status(500).json({

            success:false,
            message:error.message

        });

    }

};

export const reactToMessage =
async(req,res)=>{

try{

    const {
        messageId,
        emoji
    }=req.body;

    const userId=
    req.user._id;

    const message=
    await MessageModel.findById(
        messageId
    );

    if(!message){

        return res.status(404)
        .json({

            success:false,
            message:
            "Message not found"

        });

    }

    // already reacted?
    const existingReaction=
    message.reactions.find(

        reaction=>

        reaction.userId
        .toString()===
        userId.toString()

    );

    if(existingReaction){

        // replace emoji
        existingReaction.emoji=
        emoji;

    }

    else{

        message.reactions.push({

            userId,
            emoji

        });

    }

    await message.save();

    res.status(200).json({

        success:true,
        message

    });

}

catch(error){

    console.log(error);

    res.status(500).json({

        success:false,
        message:error.message

    });

}

};

export const deleteForMe=async(
    req,
    res
)=>{

try{

await MessageModel.findByIdAndUpdate(

    req.params.id,

    {
        $addToSet:{
            deletedFor:req.user._id
        }
    }

);

res.json({
    success:true
});

}

catch(error){

res.status(500).json({
    success:false,
    message:error.message
});

}

};



export const deleteForEveryone=async(
    req,
    res
)=>{

try{

await MessageModel.findByIdAndUpdate(

    req.params.id,

    {

        isDeletedForEveryone:true,

        text:""

    }

);

res.json({
    success:true
});

}

catch(error){

res.status(500).json({
    success:false,
    message:error.message
});

}

};