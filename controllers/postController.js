const User = require('../models/userModel');
const Post= require('../models/postModel');
const Like = require('../models/likeModel');
const Comment= require('../models/commentModel')
const Follow = require('../models/followModel');
const savedPost = require('../models/savedPostModel');

const createPost = async (req, res) => {
    // #swagger.tags = ['Post']
    try {
        const userId = req.user.userId; 
        const { content, mediaUrl } = req.body;

        if (!mediaUrl) {
            return res.status(400).json({ message: 'Media URL is required' });
        }

        const mediaType = mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'video';

        const newPost = new Post({
            user: userId,
            content,
            mediaUrl,
            mediaType,
        });

        await newPost.save();

        return res.status(201).json({ message: 'Post created successfully', post: newPost });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const deletePost = async(req,res)=>{
    // #swagger.tags = ['Post']
    try{
        const userId = req.user.userId;
        const postId = req.params.id;

        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({message:"Post not found"});
        }

        if(post.user.toString() !== userId){
            return res.status(403).json({message:"Unauthorized to delete this post"})
        }

        await Post.findByIdAndDelete(postId);

        return res.status(200).json({message:"Post delete successfully"});


    }catch(error){
        return res.status(500).json({message:"internal server error",error:error.message})
    }
};

const updatePost = async(req,res)=>{
    // #swagger.tags = ['Post']

    try{
        const userId = req.user.userId;
        const postId = req.params.id;
        const { content } = req.body;
        
        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({message:"Post not found"})
        }

        if(post.user.toString() !== userId){
            return res.status(403).json({message:"unauthorized to update this post"})
        }

        post.content = content || post.content;
        await post.save();

        return res.status(200).json({message:"post successfully updated",post});

    }catch(error){
        return res.status(500).json({message:"Internal server error", error:error.message})
    }
}

const getPostsByUser= async(req,res)=>{
    // #swagger.tags = ['Post']
    // #swagger.parameters['page'] = {in:'query', type:'interger', description:'page number'}
    // #swagger.parameter['limit'] = {in:'query', type:'interger', description:'Number of posts per page'}

    try{
        const userId = req.user.userId;
        console.log("Authenticated user ID:", userId);

        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const skip = (page - 1) * limit;

        const [posts, totalPosts] = await Promise.all([
            Post.find({ user:userId })
            .skip(skip)
            .limit(limit)
            .sort({createdAt: -1}),
            Post.countDocuments({ user: userId })]);

        if(totalPosts===0){
            return res.status(404).json({message:"No posts found this user", totalPosts:0});
        }

        // Process each post to get likes, comments, and reply comments count
        const postDetails = await Promise.all(posts.map(async (post) => {
            const likeCount = await Like.countDocuments({ post: post._id });
            const commentCount = await Comment.countDocuments({ post: post._id });

            const is_liked= await Like.exists({user: userId , post: post._id}) ? true : false;
            const is_saved = await savedPost.exists({ user:userId, post:post._id})? true : false;

            return {
                ...post.toObject(), // Keep original post details
                likes: likeCount,
                comments: commentCount,
                is_liked,
                is_saved,
            };
        }));


        return res.status(200).json({message:"Posts succesfully fetched",
            totalPosts,
            currentPage:page,
            totalPages: Math.ceil(totalPosts/limit),
            posts:postDetails
        });

    }catch(error){
        return res.status(500).json({message:"Internal server error", error:error.message})
    }
}


const getAllPosts = async (req, res) => {
    // #swagger.tags = ['Post']
    // #swagger.parameters['page'] ={ in:'query', type:'integer', description:'page number'}
    // #swagger.parameters['limit'] ={ in:'query', type:'integer', description:'Number of posts per page'}
    try {
        const userId = req.user.userId;      
        const page = parseInt(req.query.page) 
        const limit = parseInt(req.query.limit) 
        const skip = (page - 1) * limit;

        console.log("Authenticated User ID:", userId);

        const [posts, totalPosts] = await Promise.all([
            Post.find()
            .skip(skip)
            .limit(limit)
            .sort({createdAt: -1})
            .populate('user', 'username fullName imageUrl -isOtpVerified' ).lean(), // Convert to plain JS object
            Post.countDocuments()
        ]);

        if (totalPosts === 0) {
            return res.status(404).json({ message: "No posts found", totalPosts: 0 });
        }
        for (let post of posts) {
            const likesCount = await Like.countDocuments({ postId: post._id });

            const comments = await Comment.find({ post: post._id }).lean() || [];
            
            const commentsCount = comments.length;
            const is_liked = await Like.exists({ user: userId, post: post._id }) ? true : false;
            const is_saved= await savedPost.exists({user:userId, post:post._id}) ? true : false;

            post.likes = likesCount;
            post.comments = commentsCount;
            post.isOwner = post.user._id.toString() === userId;
            post.is_liked = is_liked;
            post.is_saved = is_saved;
        }

        return res.status(200).json({
            message: "All posts fetched successfully",
            totalPosts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts/limit),
            posts,
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

module.exports={createPost , deletePost, updatePost, getPostsByUser, getAllPosts};

