const Like = require('../models/likeModel');
const Post = require('../models/postModel');
const User = require('../models/userModel');
const Comment = require('../models/commentModel');
const Story = require('../models/storyModel');

const likePost = async(req,res)=>{
    // #swagger.tags = ['Likes']
    try{
        const userId = req.user.userId;
        const { postId } = req.params;

        console.log("Authenticated user ID:",userId);

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({message:"Post not found"});
        } 
        
        const existingLike = await Like.findOne({ user: userId, post:postId });
        if(existingLike){
            return res.status(400).json({message:"your already liked this post"});
        }
        
        await Like.create({ user:userId, post:postId });

        const likeCount = await Like.countDocuments({ post: postId });

        return res.status(200).json({message:"Post liked successfully",
            likeCount
        });
    }catch(error){
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
}

const unlikePost = async(req,res)=>{
    // #swagger.tags = ['Likes']

    try{
        const userId = req.user.userId;
        const { postId } = req.params;

        console.log("Authenticated user ID:",userId);

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({message:"Post not found"});
        }

        const existingLike = await Like.findOne({ user:userId, post:postId });
        if(!existingLike){
            return res.status(400).json({message:"You have not liked this post"});
        }

        await Like.findOneAndDelete({ user:userId, post:postId });

        const likeCount = await Like.countDocuments({ post:postId });

        return res.status(200).json({message:"Post Unliked successfully",
            likeCount

        });

    }catch(error){
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
}

const likeComment = async(req,res)=>{
    // #swagger.tags = ['Likes']
    try{ 
        const userId = req.user.userId;
        const {commentId} = req.params;

        console.log("Authenticated ID:",userId);

        const comment = await Comment.findById(commentId);
        if(!comment){
            return res.status(404).json({message:"Comment not found"});
        }

        const existingLike = await Like.findOne({user:userId, comment:commentId});
        if(existingLike){
            return res.status(400).json({message:"You have already liked for this comment"});

        }

        const newLike = new Like({ user: userId, comment: commentId });
        await newLike.save();
 
        const likeCount = await Like.countDocuments({ comment: commentId });
 
        return res.status(201).json({

            message: "Comment liked successfully",
            totalLikes: likeCount
        }); 

    }catch(error){
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
};


const unlikeComment = async (req, res) => {
    // #swagger.tags = ['Likes']
    try {
        const userId = req.user.userId;
        const { commentId } = req.params;

        console.log("Authenticated user ID:",userId);

        const comment = await Comment.findById(commentId);
        if(!comment){
            return res.status(404).json({message:"Comment not found"})
        }
  
        const existingLike = await Like.findOne({ user: userId, comment: commentId });
        if (!existingLike) {
            return res.status(400).json({ message: "You have not liked this comment yet" });
        }

        await Like.findByIdAndDelete(existingLike._id);

        const likeCount = await Like.countDocuments({ comment: commentId });

        return res.status(200).json({
            message: "Comment unliked successfully",
            totalLikes: likeCount
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};



const getPostLikes= async(req,res)=>{
    // #swagger.tags = ['Likes']
    try{
        const userId = req.user.userId;
        const { postId } = req.params;

        const [likes, likeCount,userLike]= await Promise.all([
            Like.find({post:postId}).populate('user', 'username fullName imageUrl'),
            Like.countDocuments({ post: postId }),
            Like.findOne({ user:userId, post:postId })
        ]);
        if(likeCount==0){
            return res.status(404).json({message:"No likes found this post",likeCount:0,likedbyAuthUser:false});
        }

        return res.status(200).json({message:"Post like fetched successfully",
            likeCount,
            likedbyAuthUser: !! userLike,
            likes:likes.map(like=>({
                userId:like.user._id,
                username:like.user.username,
                fullName:like.user.fullName,
                imageUrl:like.user.imageUrl



            })) 
        });
        
    }catch(error){
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
}


const likeStory = async(req,res)=>{
    // #swagger.tags = ['Likes']
    try{
        const userId = req.user.userId;
        const {storyId} = req.params;
        console.log("Authenticated userID",userId);

        const story = await Story.findById(storyId);
        if(!story){
            return res.status(404).json({message:"Story not found"});
        }

        if(story.user.toString() === userId){
            return res.status(400).json({message:"You cannot like yourself story"});
        }

        const viewed =  story.views.some(view=> view.user.toString() === userId);
        if(!viewed){
            return res.status(400).json({message:"You cannot like the story before viewing it"});
        }

        const existingLike= await Like.exists({ user: userId, story: storyId});
        if(existingLike){
            return res.status(400).json({message:"You have already liked this story"});
        }

        await Like.create({ user:userId, story:storyId});

        const likeCounts = await Like.countDocuments({ story: storyId});

        return res.status(200).json({message:"Story liked succesfully",
            totalLikes: likeCounts});

    }catch(error){
        return res.status(500).json({message:"Internal server error", error:error.message});
    }
};

const unLikeStory = async(req,res)=>{
    // #swagger.tags = ['Likes']
    try{
        const userId = req.user.userId;
        const { storyId } = req.params;
        console.log("Authenticated user Id",userId);

        const story = await Story.findById(storyId);
        if(!story){
            return res.status(404).json({message:"Story not found"});
        }

        const existingLike= await Like.exists({ user:userId , story: storyId});
        if(!existingLike){
            return res.status(400).json({message:"You have not liked this story"})
        }

        await Like.findOneAndDelete({ user:userId, story:storyId });

        const likeCount = await Like.countDocuments({ story: storyId});

        return res.status(200).json({message:"story unliked successfully",
            totalLikes:likeCount
        });
        
    }catch(error){
        return res.status(500).json({message:"Internal server error", error:error.message});
    }
}

module.exports={likePost, unlikePost,likeComment,unlikeComment,getPostLikes, likeStory, unLikeStory}