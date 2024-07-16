import express from 'express'
import mongoose from 'mongoose'
import axios from "axios"
import bcrypt from 'bcrypt'
import { upload } from '../middlewares/multer.js'
import { uploadOnCloudinary , deleteFromCloudinary } from '../services/cloudinary.js'
import { userModel } from '../models/userModel.js'
import fs from 'fs'
import checking from '../middlewares/middleware.js'

const userRouter = express.Router()

//update user
userRouter.put('/:id', upload.single('file'), async(req,res)=>{

    if(req.body.userId === req.params.id){

        if(req.body.birthday){
            req.body.birthday = new Date(req.body.birthday).toISOString().split('T')[0]
        }//stores only date and not (time and time zone)string

        if(req.body.type){
            if (req.file) {//change profile picture
                try {
                    const uploadResult = await uploadOnCloudinary(req.file.path)
                    const user = await userModel.findById(req.params.id);
                    let fileUrl,publicId
                
                    if (uploadResult) {
                        fileUrl = uploadResult.url;
                        fs.unlinkSync(req.file.path);
                        let updateData = {};

                        if (req.body.type === "profilePicture") {
                            publicId = user.profilePicturePublicId;
                            updateData.profilePicture = fileUrl;
                            updateData.profilePicturePublicId = uploadResult.public_id;
                        } else {
                            publicId = user.coverPicturePublicId;
                            updateData.coverPicture = fileUrl;
                            updateData.coverPicturePublicId = uploadResult.public_id;
                        }
                        if (publicId) {
                            await deleteFromCloudinary(publicId);
                        }                     
                        const updatedProfile = await userModel.findByIdAndUpdate(req.params.id,{ $set: updateData },{ new: true })
                        return res.status(200).json(updatedProfile)
                    }
                } 
                catch (error) {
                    console.log(error)
                }        
            }
            else{//remove profile picture               
                try {
                    const user = await userModel.findById(req.params.id);
                    let updateData = {},publicId;

                    if (req.body.type === "profilePicture") {
                        publicId = user.profilePicturePublicId;
                        updateData.profilePicture = '';
                        updateData.profilePicturePublicId = '';
                    } else {
                        publicId = user.coverPicturePublicId;
                        updateData.coverPicture = '';
                        updateData.coverPicturePublicId = '';
                    }
                    if (publicId) {
                        await deleteFromCloudinary(publicId);
                    }
                    const updatedProfile = await userModel.findByIdAndUpdate(req.params.id,{ $set: updateData },{ new: true })
                    return res.status(200).json(updatedProfile)
                } catch (error) {
                    console.log(error)
                }  
            }
        }       
        try {
            const updatedProfile = await userModel.findByIdAndUpdate(req.params.id,req.body,{new:true})
            return res.status(200).json(updatedProfile)
        }catch (error) {
            console.log(error)
            return res.status(400).json({msg : "updation of profile failed"})
        }
    }
    else{
        res.status(403).json({msg : "you can only update your profile"})
    }
})

//change password
userRouter.put('/changePass/:userId',async(req,res)=>{

    if(req.params.userId===req.body.userId){
        try {
            const user = await userModel.findById(req.body.userId)
            const passCheck = await bcrypt.compare(req.body.password,user.password)

            if(passCheck){
                req.body.password = await bcrypt.hash(req.body.newPassword,10)
                const response = await userModel.findByIdAndUpdate(req.body.userId,req.body,{new:true})
                delete req.body.newPassword
                res.status(200).json({res:response,isCorrect:true})
            }
            else{
                res.status(205).json({isCorrect:false})
            }
        } catch (error) {
            console.log(error)
            res.status(400).json(error)
        }
    }else{
        res.status(405).json("you cant cahnge others password!")
    }
})

//delete user
userRouter.delete('/:id',async(req,res)=>{

    if(req.query.userId === req.params.id){

        try {
            const profile = await userModel.findById(req.params.id)
            const passCheck = await bcrypt.compare(req.query.password,profile.password)
            
            if(passCheck) {
                if(profile.profilePicturePublicId)
                    await deleteFromCloudinary(profile.profilePicturePublicId);
                if(profile.coverPicturePublicId)
                    await deleteFromCloudinary(profile.coverPicturePublicId);

                const response = await axios.get(`${BASE_URL}/api/posts/profile/${profile.username}`);
                const allPosts = response.data;

                await Promise.all(
                    allPosts.map(async (post) => {
                        await axios.delete(`${BASE_URL}/api/posts/${post._id}`, { data: { userId: profile._id } });
                    })
                );

                const followers = profile.followers
                    await Promise.all(
                        followers.map(async (follo)=>{
                            await axios.put(`${process.env.BASE_URL}/api/users/${profile._id}/follow`,{userId:follo})
                        }
                    )
                )

                const following = profile.followings
                    await Promise.all(
                        following.map(async (follo)=>{
                            await axios.put(`${BASE_URL}/api/users/${profile._id}/removefollow`,{userId:follo})
                        }
                    )
                )
                
                await userModel.findByIdAndDelete(req.params.id);
                res.status(201).json({ msg: "Account deleted successfully!" });
            }
            else {
                return res.status(201).json({msg:"password is incorrect",isCorrect:false})
            }
        } catch (error) {
            console.log(error)
            res.status(400).json({msg : "deletion fails"})
        }
    } else{
        res.status(400).json({msg : "you can only delete your profile"})
    }
})

//get user
userRouter.get('/',async(req,res)=>{
    const userId = req.query.userId;
    const username = req.query.username;

    if (!userId && !username) {
        return res.status(400).json({ msg: 'userId or username must be provided' });
    }

    try {
        const userProfile = userId ? await userModel.findById(userId)
                                    : await userModel.findOne({username:username}) 
        if(!userProfile._id)
            return res.status(400).json({ msg: 'user not found' });
        res.status(200).json(userProfile)
    } 
    catch (error) {
        console.log(error)
        res.status(400).json({msg : "fetching failed"})
    }

})

//search user
userRouter.get('/search/:query',async(req,res)=>{
    const query = req.params.query
    try {
        const response = await userModel.find({ username: { $regex: query, $options: 'i' } });
        res.status(200).json(response)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

//get all followers and following
userRouter.get('/follow/:id',async(req,res)=>{
    const userId = req.params.id
    try {
        const response = await userModel.findById(userId,{_id:0,followers:1,followings:1})
        res.status(200).json(response)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
    
})

//get all friends (followings)
userRouter.get('/friends/:userId', async(req,res)=> {
    
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        // Fetch the user by ID
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json("User not found");
        }

        const followings = user.followings || [];

        // Ensure all followings are valid ObjectId strings
        const validFollowings = followings.filter(friendId => {
            const isValid = mongoose.Types.ObjectId.isValid(friendId);
            if (!isValid) {
                console.warn(`Invalid friendId: ${friendId}`);
            }
            return isValid;
        });

        // Fetch details of each following user
        const friends = await Promise.all(
            validFollowings.map((friendId) => {
                return userModel.findById(friendId, { _id: 1, username: 1, profilePicture: 1 });
            })
        );

        // Create a list of friends' details
        let friendList = friends.map((friend) => {
            if (friend) {
                const { _id, username, profilePicture } = friend;
                return { _id, username, profilePicture };
            }
        }).filter(friend => friend !== undefined); // Filter out any undefined values

        res.status(200).json(friendList);
        
    } 
    catch (err) {
        console.error(err);
        res.status(500).json(err);
    }

})

//follow a user
userRouter.put('/:id/follow',async(req,res)=>{

    if(req.body.userId !== req.params.id){
        let user = await userModel.findById(req.body.userId)
        let userToFollow = await userModel.findById(req.params.id)        
        if(!user.followings.includes(req.params.id)){
            await user.updateOne({$push : {followings:req.params.id }})
            await userToFollow.updateOne({$push : {followers:req.body.userId }})
            res.status(200).json({msg:"following done"})
        }
        else{
            await user.updateOne({$pull : {followings:req.params.id }})
            await userToFollow.updateOne({$pull : {followers:req.body.userId }})
            res.status(200).json({msg:"unfollowing done"})
        }
    } else{
        res.status(400).json({msg:"cant follow your profile itself"})
    }
})

//remove a follower
userRouter.put('/:id/removeFollow',async(req,res)=>{

    if(req.params.id!==req.body.userId){
        try {
            await userModel.updateOne({_id:req.params.id},{$pull:{followings:req.body.userId}})
            await userModel.updateOne({_id:req.body.userId},{$pull:{followers:req.params.id}})
            res.status(200).json({"msg":"follower removed"})
        } catch (error) {
            console.log(error)
            res.status(400).json(error)
        }
    } else{
        res.status(405).json({"msg":"forbidden!"})
    }

})

//get all users
userRouter.get('/allUsers',async(req,res)=>{
    try {
        const response = await userModel.aggregate([
            {
              $addFields: {
                followersLength: { $size: "$followers" },
                followingsLength: { $size: "$followings" }
              }
            },
            {
              $sort: {
                followersLength: -1, 
                followingsLength: 1 
              }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    profilePicture: 1,
                    birthday : 1
                }
            }
          ]);
        res.status(200).json(response)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

export default userRouter
