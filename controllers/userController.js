const User = require('../models/userModel');
const mongoose =require('mongoose');
const bcrypt= require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer= require('nodemailer');
const { blacklistToken } = require('../middleware/authMiddleware');
const SECRET_KEY = "YOUR_SECRET_KEY";
const Follow = require('../models/followModel');
const Post = require('../models/postModel');
const Block = require('../models/blockModel');
const Favorite = require('../models/favoriteModel');

const registerUser = async (req, res) => {
    // #swagger.tags= ['Users']
    try {
        const {
            username, email, password, fullName,
            phoneNumber,bio, gender, dateOfBirth,imageUrl
        } = req.body;

        console.log('Incoming Data:', req.body); 


        if (!email || !password) {
            return res.status(400).json({ message: 'Email and Password is required' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = new User({
            username,
            email,
            password,
            fullName,
            phoneNumber,
            gender,
            dateOfBirth,
            bio,
            imageUrl
        });

        await user.save();

        // Exclude password from the response
        const { password: _, ...userData } = user.toObject();

        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '365d' });
        console.log('Generated JWT token:', token);

        res.status(201).json({
            message: 'User registered successfully', token,
            user: userData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const loginUser = async (req, res) => {
    // #swagger.tags= ['Users']
    try {
        const { email, password } = req.body;

        console.log('Login Request Data:', req.body);

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.password) {
            console.error('Stored password is undefined for user:', user.email)
            return res.status(500).json({ message: 'Stored password is undefined' });
        }

        console.log('Stored hashed password:', user.password);
        console.log('Input password:', password);



        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
            console.error('Password does not match for user:', user.email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '365d' });
        console.log('Generated JWT token:', token);

        return res.json({ message: 'Login successful', token });
    } catch (error) {
        return res.status(500).json({ message:"Internal server error",error: error.message });
    }
};


const getProfile = async (req, res) => {
    // #swagger.tags = ['Users']
    try {
        const userId = req.user.userId; 

        const user = await User.findById(userId).select('-isOtpVerified');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const totalPosts = await Post.countDocuments({ user: userId });
        const totalFollowers = await Follow.countDocuments({ following: userId });
        const totalFollowing = await Follow.countDocuments({ follower: userId });


        return res.status(200).json({message:"User Profile",
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            bio: user.bio,
            imageUrl: user.imageUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            totalPosts,
            totalFollowers,
            totalFollowing
        });

    } catch (error) {
        return res.status(500).json({message:"Internal server error",error: error.message });
    }
};


const updateUserProfile = async (req, res) => {
     // #swagger.tags = ['Users']
    try {
        const userId = req.user.userId; 
        const { username,fullName, gender, dateOfBirth, bio,imageUrl } = req.body;
        console.log("Request Body:",req.body);

        const updatedData = {};

        if (username) updatedData.username = username;
        if (fullName) updatedData.fullName = fullName;
        if (gender) updatedData.gender = gender;
        if (dateOfBirth) updatedData.dateOfBirth = dateOfBirth;
        if (bio) updatedData.bio = bio;
        if (imageUrl) updatedData.imageUrl = imageUrl;

        
        console.log("Updated Data:", updatedData);

        const updatedProfile = await User.findByIdAndUpdate(userId, updatedData, { new: true });

        if (!updatedProfile) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        });
    } catch (error) {
        return res.status(500).json({message:"Internal server error",error: error.message });
    }
};



const deleteProfile = async (req, res) => {
    // #swagger.tags= ['Users']
    try {
        const  userId  = req.params;
        console.log("User ID to delete:", userId); 
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'Profile deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


const searchUser = async (req, res) => {
    // #swagger.tags= ['Users']
    try {
        const userId = req.user.userId;
        const { username, phoneNumber} = req.query;
         
        console.log("Authenticated user ID:",userId);


        if (!username && !phoneNumber) {
            return res.status(400).json({ message: 'Username or phoneNumber  is required ' });
        }
        
        // Fetch blocked users list (users blocked by the authenticated user)
        const blockedUsers = await Block.find({ blocker: userId }).select("blocked");
        const blockedUserIds = blockedUsers.map(block => block.blocked.toString());

        // Fetch users who have blocked the authenticated user
        const usersWhoBlockedMe = await Block.find({ blocked: userId }).select("blocker");
        const blockedByUserIds = usersWhoBlockedMe.map(block => block.blocker.toString());


        // const users = await User.find({ 
        //     username: { $regex: username, $options: 'i' },
        //     _id: { $ne: userId ,  $nin: blockedByUserIds }   // Exclude authenticated user & users who blocked them

        // })
        // .select('-email -phoneNumber -password -isOtpVerified -__v -createdAt -updatedAt');

        // if (users.length === 0) {
        //     return res.status(404).json({ message: 'No users found' });
        // }

        const searchQuery = {
            _id: { $ne: userId, $nin: blockedByUserIds }
        };

        if (username) {
            searchQuery.username = { $regex: username, $options: 'i' };
        }

        if (phoneNumber) {
            searchQuery.phoneNumber = phoneNumber;
        }

        const users = await User.find(searchQuery)
            .select('-email -phoneNumber -password -isOtpVerified -__v -createdAt -updatedAt');

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }



        // Fetch additional details for each user, except for blocked users
        const userDetails = await Promise.all(users.map(async (user) => {
            const userObj = user.toObject(); // Convert Mongoose document to plain object
            const followersCount = await Follow.countDocuments({ following: user._id });
            const followingCount = await Follow.countDocuments({ follower: user._id });
            const postCount = await Post.countDocuments({ user: user._id });

           
            const is_followed = await Follow.exists({following: userId,  follower: user._id})?true : false;
            const is_following= await Follow.exists({ follower:userId, following:user._id})? true : false;
            const is_fav = await Favorite.findOne({ user: userId, favoriteUser: user._id }) ? true : false;

            const is_blocked = await Block.findOne({blocker: userId, blocked: user._id }) ? true : false;
            return {
                ...user.toObject(), // Keep all other user details
                followers: followersCount,
                following: followingCount,
                totalposts: postCount,
                is_followed,
                is_following,
                is_fav,
                is_blocked
            };
        }));

        return res.json({ users: userDetails });
    } catch (error) {
        return res.status(500).json({ message:"Internal server error",error: error.message });
    }
};


const logoutUser = async (req, res) => {
    // #swagger.tags = ['Users']
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        blacklistToken(token);

        return res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error:error.message });
    }
};

const getUserDetails= async(req,res)=>{
    // #swagger.tags = ['Users']
    try{
        const { userId } = req.user;
        const {id: targetUserId }= req.params;

        console.log("User ID:",userId);
        console.log("targetUser Id:",targetUserId);

        if (userId === targetUserId) {
            return res.status(403).json({ message: "You cannot view your own profile details" });
        }

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "Invalid User ID format" });
        }

        const user = await User.findById(targetUserId).select('-otp -password -_v');
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const totalFollowers= await Follow.countDocuments({following:targetUserId});
        const totalFollowing=await Follow.countDocuments({follower:targetUserId});
        const postCount = await Post.countDocuments({ user: user._id });
        const is_following = await Follow.exists({ follower: userId,following: user._id }) ? true : false;
        const is_followed = await Follow.exists({following: userId,  follower: user._id})?true : false;
        const is_fav = await Favorite.findOne({user: userId, favoriteUser: user._id }) ? true : false;
        const is_blocked = await Block.findOne({blocker: userId, blocked: user._id }) ? true : false;

                                                                                           
        return res.status(200).json({message:"User details fetched succecssfully",
            user:{
                username:user.username,
                fullName:user.fullName,
                gender:user.gender,
                bio:user.bio,
                dateofBirth:user.dateOfBirth,
                imageUrl:user.imageUrl,
                totalFollowers,
                totalFollowing,
                totalPosts:postCount,
                is_followed,
                is_following,
                is_fav,
                is_blocked

            }
        })


    }catch(error){
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
} 
                    
module.exports = 
   { registerUser,loginUser,getProfile, updateUserProfile,
    deleteProfile, searchUser,logoutUser, getUserDetails}
