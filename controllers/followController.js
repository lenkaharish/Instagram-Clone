const User = require('../models/userModel');
const Follow = require('../models/followModel');

const followUser = async (req, res) => {
    // #swagger.tags = ['Follow']
    try {
        const followerId = req.user.userId; 
        const { targetUserId } = req.body; 

        if (!targetUserId) {
            return res.status(400).json({ message: "Target user ID is required" });
        }

        console.log("Target User ID:", targetUserId);

        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (followerId === targetUser._id.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const existingFollow = await Follow.findOne({ follower: followerId, following: targetUser._id });
        if (existingFollow) {
            return res.status(400).json({ message: "You are already following this user" });
        }

        const follow = new Follow({
            follower: followerId,
            following: targetUser._id
        });

        await follow.save();

        const totalFollowers = await Follow.countDocuments({ following: targetUser._id });

        return res.status(200).json({
            message: `You are now following ${targetUser.username}`,
            followedUser: {
                userId: targetUser._id,
                username: targetUser.username,
                fullName: targetUser.fullName,
                totalFollowers
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};



const unfollowUser = async (req, res) => {
    // #swagger.tags = ['Follow']
    try {
        const followerId = req.user.userId; 
        const { targetUserId } = req.body; 

        if (!targetUserId) {
            return res.status(400).json({ message: "Target user ID is required" });
        }

        console.log("Target User ID:", targetUserId);

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (followerId === targetUser._id.toString()) {
            return res.status(400).json({ message: "You cannot unfollow yourself" });
        }

        const existingFollow = await Follow.findOne({ follower: followerId, following: targetUser._id });
        if (!existingFollow) {
            return res.status(400).json({ message: "You are not following this user" });
        }

        await Follow.deleteOne({ follower: followerId, following: targetUser._id });

        const totalFollowers = await Follow.countDocuments({ following: targetUser._id });

        return res.status(200).json({
            message: `You have unfollowed ${targetUser.username}`,
            unfollowedUser: {
                userId: targetUser._id,
                username: targetUser.username,
                fullName: targetUser.fullName,
                totalFollowers
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getFollows = async(req,res)=>{
    // #swagger.tags = ['Follow']
    try{
        const userId = req.user.userId; 
        if(!userId){
            return res.status(404).json({message:"User not found"});
        }

        const followers = await Follow.find({following:userId }).populate('follower','username fullName imageUrl');
        if(!followers.length){
            return res.status(200).json({message:"You dont have any followers",totalFollowers:0});
        }

        const totalFollowers= followers.length;

        return res.status(200).json({message:"followers retrieved succesfully",
            totalFollowers,
            followers: followers.map(f=>({
                username:f.follower.username,
                fullName:f.follower.fullName,
                imageUrl:f.follower.imageUrl
            }))
        })


    }catch(error){
        return res.status(400).json({message:"internal server error",error:error.message});
    }
}

const getFollowings= async(req,res)=>{
    // #swagger.tags = ['Follow']
    try{
        const userId = req.user.userId;
        if(!userId){
            
            return res.status(404).json({message:"User not found"});
        }

        const followings = await Follow.find({follower: userId }).populate('following','username fullName imageUrl');
        if(!followings.length){
            return res.status(200).json({message:"you are not following anyone",totalfollowings:0});
        }

        const totalfollowings= followings.length;

        return res.status(200).json({message:"Followings list retrieved successfully",
            totalfollowings,
            followings: followings.map(f=>({
                username:f.following.username,
                fullName:f.following.fullName,
                imageUrl:f.following.imageUrl

            }))
        })




    }catch(error){
        return res.status(400).json({message:"internal server error",error:error.message});
    }
}


module.exports = { followUser,unfollowUser,getFollows,getFollowings, };
