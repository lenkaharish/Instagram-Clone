const User = require('../models/userModel');
const Block= require('../models/blockModel');
const Post = require('../models/postModel');
const Follow= require('../models/followModel');
const Favorite = require('../models/favoriteModel');

const blockUser= async(req,res)=>{
    // #swagger.tags= ['Block User']
    try{
        const  userId = req.user.userId;
        const { id:targetUserId } = req.params;

        console.log("user Id:",userId);
        console.log("tagetUserId to block:",targetUserId);
        
        // Fetch the target user from the database
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }


       //Prevent blocking oneself
       if (userId === targetUserId) {
        return res.status(400).json({ message: "You cannot block yourself" });
    }

        // Check if the user is already blocked
       const existingBlock= await Block.findOne({blocker: userId, blocked: targetUser._id});
       if(existingBlock){
        return res.status(400).json({message:"User is already blocked"});
       }

       const block = new Block({
        blocker: userId,
        blocked: targetUser._id
       });

       await block.save();

       return res.status(200).json({
        message:`You have blocked ${targetUser.username}`,
        blockedUser:{
            username: targetUser.username,
            fullName:targetUser.fullName,
            userId: targetUser._id

        }
       }) 

    }catch(error){
        return res.status(500).json({message:"internal server error",error:error.message})
    }
}


const unblockUser= async(req,res)=>{
    // #swagger.tags= ['Block User']
    try{
        const  userId = req.user.userId;
        const { id: targetUserId } = req.params;

        console.log("user Id:",userId);
        console.log("Target user Id to unblock:",targetUserId);

        const targetUser= await User.findById(targetUserId);
        if(!targetUser){
            return res.status(404).json({message:"User not found"});

        }

        const existingBlock= await Block.findOne({blocker:userId , blocked: targetUser._id});
        if(!existingBlock){
            return res.status(400).json({message:"User is not blocked"});
        }

         // Remove the block record from the database
         await Block.deleteOne({ _id: existingBlock._id }); 

         return res.status(200).json({
            message:`You have unblocked ${targetUser.username}`,
            unblockedUser:{
                username:targetUser.username,
                fullName:targetUser.fullName,
                userId:targetUser._id

            }

         })

        

    }catch(error){
        return res.status(500).json({message:"internal server error",error:error.message})
    }
};

const getBlockedUsers = async (req, res) => {
    // #swagger.tags = ['Block User']
    try {
        const userId = req.user.userId;
        console.log("Authenticated User ID:", userId);

        // Find all blocked users by the authenticated user
        const blockedUsers = await Block.find({ blocker: userId }).populate('blocked', 'username fullName imageUrl bio');

        const totalBlockedCount = blockedUsers.length;

        // Map through the blocked users to format the response
        const blockedUserDetails = await Promise.all(blockedUsers.map(async (block) => {
            const blockedUserId = block.blocked._id;

            // Fetch counts and status for each blocked user
            const totalPosts = await Post.countDocuments({ user: blockedUserId });
            const totalFollowers = await Follow.countDocuments({ following: blockedUserId });
            const totalFollowing = await Follow.countDocuments({ follower: blockedUserId });

            const is_followed = await Follow.exists({follower:blockedUserId , following:userId}) ? true : false;
            const is_following = await Follow.exists({follower:userId, following:blockedUserId})? true : false;

            const is_fav = await Favorite.findOne({ user: userId, favoriteUser: blockedUserId }) ? true : false;
            const is_blocked = await Block.findOne({ blocker: userId, blocked: blockedUserId }) ? true : false;

            return {
                userId: blockedUserId,
                username: block.blocked.username,
                fullName: block.blocked.fullName,
                imageUrl: block.blocked.imageUrl,
                totalPosts,
                totalFollowers,
                totalFollowing,
                is_fav,
                is_followed,
                is_following,
                is_blocked
            };
        }));

        return res.status(200).json({
            message: "Blocked users fetched successfully",
            totalBlockedCount,
            blockedUsers: blockedUserDetails,
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

module.exports={blockUser,unblockUser,getBlockedUsers}