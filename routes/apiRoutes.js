const express = require('express');

const router = express.Router();


const { registerUser,loginUser, getProfile,deleteProfile,searchUser, updateUserProfile, logoutUser, getUserDetails} = require('../controllers/userController');
const upload = require('../middleware/uploadMiddleware');
const { authMiddleware }= require('../middleware/authMiddleware');
const {followUser, unfollowUser, getFollows, getFollowings}= require('../controllers/followController');

const { uploadImage } = require('../controllers/imageController');
const { createPost, deletePost, updatePost, getPostsByUser, getAllPosts} = require('../controllers/postController');
const {forgotPassword,verifyOtp,confirmPassword,}= require('../controllers/otpController');
const { blockUser, unblockUser, getBlockedUsers } = require('../controllers/blockController');
const { addFavoriteUser, removeFavoriteUser, getFavorites } = require('../controllers/favoriteController');
const { likePost, unlikePost, getPostLikes, likeComment, unlikeComment, likeStory, unLikeStory } = require('../controllers/likeController');
const { addComment,addReplyToComment,deleteComment,getComments} = require('../controllers/commentController');
const { savePost, unsavePost, getAllSavedPosts } = require('../controllers/savedPostController');
const { createStory, deleteStory,getStoriesByUser, viewStory, getStoriesById} = require('../controllers/storyController');


// user routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/searchUser', authMiddleware, searchUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp );
router.post('/confirm-password', confirmPassword);
router.post('/user/:id', authMiddleware, getUserDetails);
router.get('/profile', authMiddleware, getProfile);
router.put('/update/profile', authMiddleware, updateUserProfile);
router.delete('/delete/profile/:id', authMiddleware,deleteProfile);
router.post('/logout/user',authMiddleware,logoutUser);


// upload images or videos
router.post('/upload/image/video',upload.single('image'), uploadImage);

// post routes
router.post('/create/post', authMiddleware, createPost);
router.delete('/delete/post/:id', authMiddleware, deletePost);
router.put('/update/post/:id', authMiddleware, updatePost);
router.get('/get/user/posts',authMiddleware,getPostsByUser)
router.get('/get/all/posts', authMiddleware, getAllPosts);

// post liked routes
router.post('/posts/:postId/like', authMiddleware,likePost);
router.delete('/posts/:postId/unlike', authMiddleware, unlikePost);
router.get('/post/:postId/likes', authMiddleware, getPostLikes);

//comment like routes
router.post('/like/comment/:commentId',authMiddleware,likeComment);
router.delete('/unlike/comment/:commentId',authMiddleware,unlikeComment);

// story like routes
router.post('/like/story/:storyId', authMiddleware,likeStory); 
router.delete('/unlike/story/:storyId',authMiddleware, unLikeStory);

//comment routes
router.post('/add/comment/:postId',authMiddleware,addComment);
router.delete('/delete/comment/:commentId',authMiddleware,deleteComment);
router.post('/post/:postId/comments', authMiddleware, getComments);
router.post('/reply/comment/:commentId',authMiddleware,addReplyToComment);

// story routes
router.post('/create/story', authMiddleware, createStory);
router.delete('/delete/story/:storyId',authMiddleware, deleteStory);
router.get('/get/user/stories', authMiddleware,getStoriesByUser);
router.post('/post/user/:storyId', authMiddleware, getStoriesById);
router.post("/view/:storyId", authMiddleware, viewStory);

// follow routes
router.post('/follow', authMiddleware, followUser);
router.post('/unfollow',authMiddleware,unfollowUser);
router.get('/followers',authMiddleware,getFollows);
router.get('/followings',authMiddleware,getFollowings);

// block routes
router.post('/block/:id',authMiddleware,blockUser);
router.delete('/unblock/:id',authMiddleware,unblockUser);
router.get('/blocked-users',authMiddleware,getBlockedUsers);

// fav routes
router.post('/add/favorite/:id',authMiddleware,addFavoriteUser);
router.delete('/remove/favorite/:id', authMiddleware,removeFavoriteUser);
router.get('/favorites',authMiddleware,getFavorites);

// save routes
router.post('/save/:postId', authMiddleware, savePost);
router.delete('/unsave/:postId',authMiddleware,unsavePost);
router.get('/all/saved/posts',authMiddleware,getAllSavedPosts);

module.exports = router;


