const Story = require('../models/storyModel');
const User = require('../models/userModel');
const Like = require('../models/likeModel');
const Comment = require('../models/commentModel');


const createStory = async(req,res)=>{
    // #swagger.tags = ['story']
    try{
        const userId = req.user.userId;
        const { mediaUrl } = req.body;

        if(!mediaUrl){
            return res.status(400).json({message:"Media Url is required"});
        }

        const mediaType = mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image" : "video";

        const newStory = new Story({
            user: userId,
            mediaUrl,
            type : mediaType
        });

        await newStory.save();

        return res.status(200).json({message:"story added successfully", story: newStory });       

    }catch(error){
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
}

const deleteStory = async(req,res)=>{
    // #swagger.tags = ['story']
    try{
        const  userId = req.user.userId;
        const { storyId }= req.params;

        console.log("Authenticated user ID:",userId);

        const story = await Story.findById(storyId);
        if(!story){
            return res.status(404).json({message:"Story not found"});
        }

        if(story.user.toString() !== userId){
            return res.status(403).json({message:"Unauthorized cannot delete the story"});
        }

        await Story.findByIdAndDelete( storyId );

        return res.status(200).json({message:"Story deleted successfully"});

    }catch(error){
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
}


const getStoriesByUser = async(req,res)=>{
    // #swagger.tags = ['story']
    try{
        const userId = req.user.userId;
        console.log('Authenticated user ID:',userId);

        const stories = await Story.find({ user:userId}).sort({createdAt: 1});
        if(!stories.length){
            return res.status(404).json({message:"No stories found this user"});
        }


        const totalStories = await Story.countDocuments({ user: userId });

        const storiesWithCounts = await Promise.all(stories.map(async(story)=>{
            const likeCount = await Like.countDocuments({ story:story._id});
            const viewCount = story.views.length;
            return {
                _id: story._id,
                user: story.user,
                mediaUrl: story.mediaUrl,
                type: story.type,
                createdAt: story.createdAt,
                likeCount,
                viewCount,
            };

        }));

        return res.status(200).json({message:"Stories fetched successfully", totalStories,stories: storiesWithCounts})
    }catch(error){
        return res.status(500).json({message:"Internal server error",error:error.message});
        
    }
};


const getStoriesById = async(req,res)=>{
    // #swagger.tags = ['story']
    try{
        const userId = req.user.userId;
        const { storyId } = req.params;

        console.log("Authenticated userID:", userId);

        const story = await Story.findById(storyId);
        if(!story){
            return res.status(404).json({message:"story not found"});
        }
        
    
        const is_viewed = story.views.some(view=>view.user.toString() === userId);
        if(!is_viewed && story.user.toString() !== userId){
            story.views.push({user:userId, viewedAt:Date.now()});
            await story.save();
            is_viewed = true;
        }
 
        const is_liked = await Like.exists({user: userId , story: story._id}) ? true : false;
        const likeCount = await Like.countDocuments({ story: story._id});
        const viewCount = story.views.length;
        const is_owner = story.user.toString() === userId;

        return res.status(200).json({message:"stories fetched successfully",
            story:{
                _id:story._id,
                user:story._id,
                mediaUrl: story.mediaUrl,
                type:story.type,
                createdAt:story.createdAt,
                likeCount,
                viewCount,
                is_liked,
                is_viewed,
                is_owner

            }
        });


    }catch(error){
        return res.status(500).json({message:"Internal server error",error: error.message});
    }
}

const viewStory = async(req,res)=>{
    // #swagger.tags = ['story']
    try{
        const userId = req.user.userId;
        const { storyId } = req.params;

        console.log("Authenticated user ID:", userId);
        const story = await Story.findById(storyId);
        if(!story){
            return res.status(404).json({message:"Story not found"});
        }

        if (story.user.toString() === userId) {
            return res.status(200).json({
                message: "You are the owner of this story",
                story
            });
        }

        const alreadyViewed = story.views.some(view => view.user.toString() == userId);
        if(alreadyViewed){
            return res.status(200).json({message:"Story already viewed", story});

        }
          
        story.views.push({ user:userId, viewedAt: new Date()});
        await story.save();

        return res.status(200).json({message:"story viewed successfully", story});

    }catch(error){
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
};

module.exports = { createStory, deleteStory, getStoriesByUser, getStoriesById,viewStory}