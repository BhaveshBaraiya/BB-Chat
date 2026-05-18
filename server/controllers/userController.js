import UserModel from "../models/UserModel.js";

export const getUsers = async ( req, res ) => {

    try {
        const users =
            await UserModel.find({
                _id: {
                    $ne:
                    req.user._id
                }
            })
            .select(
                "-password"
            );

        res.status(200).json({
            success:true,
            users
        });

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
};