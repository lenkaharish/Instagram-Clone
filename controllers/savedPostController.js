const savedPost = require('../models/savedPostModel');
const Post = require('../models/postModel');
const User = require('../models/userModel');
const Like = require('../models/likeModel');
const Comment = require('../models/commentModel');


const savePost = async(req,res)=>{
    // #swagger.tags = ['Save Posts']
    try{
        const userId = req.user.userId;
        const { postId } = req.params;

        console.log("Authenticated user ID:",userId);

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({message:"Post not found"});
        }

        const alreadySaved = await savedPost.findOne({ user:userId ,post: postId});
        if(alreadySaved){
            return res.status(400).json({message:"Post already saved"})
        }

        await savedPost.create({user:userId , post:postId});

        return res.status(200).json({message:"Post saved successfully"});
    

    }catch(error){
        return res.status(500).json({message:"Internal server error", error: error.message});
    }
}

const unsavePost = async(req,res)=>{
    // #swagger.tags = ['Save Posts']
    try{
        const userId = req.user.userId;
        const { postId } = req.params;
        console.log('authenticated user ID:',userId);

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({message:"Post not found"});
        }

        const alreadySaved = await savedPost.findOne({user:userId, post:postId});
        if(!alreadySaved){
            return res.status(400).json({message:"Post is not saved"});
        }
        await savedPost.deleteOne({_id:alreadySaved._id});
        
        return res.status(200).json({message:"Post Unsaved successfully"});


    }catch(error){
        return res.status(500).json({message:"Internal server error",error: error.message});
    }
};


const getAllSavedPosts = async (req, res) => {
    // #swagger.tags = ['Save Posts']

    try {
        const userId = req.user.userId;
        console.log("Authenticated user ID:", userId);

        const savedPosts = await savedPost.find({ user: userId }).populate('post');

        if (!savedPosts.length) {
            return res.status(404).json({ message: "No saved posts found", totalSavedPosts: 0, savedPosts: [] });
        }

        const postDetails = await Promise.all(savedPosts.map(async (saved) => {
            if (!saved.post) {
                return null; // Skip if post doesn't exist
            }

            const is_liked = await Like.exists({ user: userId, post: saved.post._id }) ? true : false;
            const is_saved = await savedPost.exists({ user: userId, post: saved.post._id }) ? true : false;

            return {
                postId: saved.post._id,
                content: saved.post.content,
                media: saved.post.media,
                createdAt: saved.post.createdAt,
                totalLikes: saved.post.likes?.length || 0, 
                totalComments: saved.post.comments?.length || 0,
                is_saved,
                is_liked,
                is_owner: saved.post.user.toString() === userId  
            };
        }));

        const filteredPosts = postDetails.filter(post => post !== null);

        return res.status(200).json({
            message: "Saved posts fetched successfully",
            totalSavedPosts: filteredPosts.length,
            savedPosts: filteredPosts
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


module.exports = { savePost, unsavePost, getAllSavedPosts}