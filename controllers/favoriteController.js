const Favorite= require('../models/favoriteModel');
const User = require('../models/userModel');
const Post = require('../models/postModel');
const Follow= require('../models/followModel');
const Block = require('../models/blockModel');

const addFavoriteUser= async (req,res)=>{
    // #swagger.tags = ['favorite']
    try{
        const  userId = req.user.userId;
        const { id: favoriteUserId} = req.params;

        console.log("userID:",userId);
        console.log("FavoriteUserId:",favoriteUserId);

        const favoriteUser = await User.findById(favoriteUserId);
        if(!favoriteUser){
            return res.status(404).json({message:'User not found'})
        }

        if(userId === favoriteUserId){
            return res.status(400).json({message:"You cannot add  favorite yourself"});
        }

        const existingFavorite= await Favorite.findOne({user: userId, favorite:favoriteUser._id})
        if(existingFavorite){
            return res.status(400).json({message:"User is already in favorites"})
        }

        const favorite= new Favorite({
            user:userId,
            favorite:favoriteUser._id,
        });
        await favorite.save();


        return res.status(200).json({
            message:`You have added ${favoriteUser.username} to your favorites`,
            favoriteUser:{
                username: favoriteUser.username,
                fullName: favoriteUser.fullName,
                userId:favoriteUser._id
            },
        });
    }catch(error){
        return res.status(500).json({message:"internal server error",error:error.message})
    }
}

const removeFavoriteUser= async(req,res)=>{
    // #swagger.tags = ['favorite']
    try{
        const userId = req.user.userId;
        const { id: favoriteUserId } = req.params;

        console.log('User ID:', userId );
        console.log('FavoriteUser ID:',favoriteUserId);

        const favoriteUser= await User.findById(favoriteUserId);
        if(!favoriteUser){
            return res.status(404).json({message:"User not found"})
        }
        
        if(userId === favoriteUserId ){
            return res.status(400).json({message:"you cannot remove favorite yourself "})
        }

        const existingFavorite= await Favorite.findOne({user: userId, favorite: favoriteUser._id});
        if(!existingFavorite){
            return res.status(400).json({message:"User is not in your favorites"})
            
        }

        await Favorite.deleteOne({_id:existingFavorite._id});

        return res.status(200).json({
            message:`You have removed ${favoriteUser.username} from your favorites`,
            favoriteUser:{
                username:favoriteUser.username,
                fullName:favoriteUser.fullName,
                userId:favoriteUser._id

            },
        });
    }catch(error){
        return res.status(500).json({message:"internal server error",error:error.message})
    }
}


const getFavorites = async (req, res) => {
    // #swagger.tags = ['favorite']

    try {
        const userId = req.user.userId;
        console.log("User ID:", userId);

        const favorites = await Favorite.find({ user: userId }).populate('favorite', 'username fullName imageUrl');

        // Process each favorite user
        const favoriteUsers = await Promise.all(favorites.map(async (fav) => {
            const favoriteUserId = fav.favorite._id;

            const totalPosts = await Post.countDocuments({ user: favoriteUserId });
            const totalFollowers = await Follow.countDocuments({ following: favoriteUserId });
            const totalFollowing = await Follow.countDocuments({ follower: favoriteUserId });

            const is_followed = await Follow.exists({follower:favoriteUserId, following:userId}) ? true : false;
            const is_following = await Follow.exists({follower:userId, following:favoriteUserId})? true : false;
            const is_blocked = await Block.findOne({blocker: userId, blocked: favoriteUserId })? true : false;
            const is_fav = await Block.findOne({user:userId, favoriteUser: favoriteUserId})? true : false;


            return {
                userId: favoriteUserId,
                username: fav.favorite.username,
                fullName: fav.favorite.fullName,
                imageUrl: fav.favorite.imageUrl,
                totalPosts,
                totalFollowers,
                totalFollowing,
                is_followed,
                is_following,
                is_fav,
                is_blocked
            };
        }));

        return res.status(200).json({
            message: "Favorite users fetched successfully",
            totalFavorites: favoriteUsers.length,
            favoriteUsers
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

module.exports={ addFavoriteUser , removeFavoriteUser, getFavorites };