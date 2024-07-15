import express from 'express';
import { upload } from '../middlewares/multer.js'; 
import { deleteFromCloudinary, uploadOnCloudinary } from '../services/cloudinary.js'; 
import postModel from '../models/postModel.js';
import { userModel } from '../models/userModel.js'
import fs from 'fs';

const postRouter = express.Router();

//create post
postRouter.post('/', upload.single('file'), async (req, res) => {

  try {
    
    const {description, userId, location, tags} = req.body;
    let fileUrl = null

    if (req.file) {

        try {
            const uploadResult = await uploadOnCloudinary(req.file.path);
            if (uploadResult) {
                fileUrl = uploadResult.url;
                fs.unlinkSync(req.file.path); // Remove the file from the local server
            
                const newPost = await postModel.create({
                    "description" : description,
                    "img" : fileUrl,
                    "imgPublicId" : uploadResult.public_id,
                    "userId": userId, // Assuming you have a user authentication setup
                    "location" : location,
                    "tags" : tags
                });
            
                return res.status(200).json({ msg: "Post created successfully", ...newPost._doc });
            }
        } 
        catch (error) {
            console.log(error)
        }

    }

  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "Failed to create a new post, try again" });
  }
});

//comment a post
postRouter.put('/:postId',async(req,res)=>{
    const id = req.params.postId
    try {
        const comment = {
            userId : req.body.userId,
            cmt : req.body.cmt
        }
        const response = await postModel.updateOne({_id:id},{$push:{comments:comment}},{new:true})
        res.json(response)
    } catch (error) {
        console.log(error)
    }
})

//update post
postRouter.put('/:id',async(req,res)=>{

    const postToUpdate = await postModel.findById(req.params.id)

    if(req.body.userId === postToUpdate.userId){
        try {
            const updatedPost = await postModel.findByIdAndUpdate(req.params.id,req.body,{new:true})
            res.status(200).json({msg: "post updation done",...updatedPost})
        } 
        catch (error) {
            console.log(error)
            res.status(400).json({msg: "failed  to update post"})
        }
    }
    else{
        res.status(400).json({msg: "cant update another ones post"})
    }

})

//delete post
postRouter.delete('/:id',async(req,res)=>{

    const postToDelete = await postModel.findById(req.params.id)
    if(req.body.userId === postToDelete.userId){
        try {
            const publicId = postToDelete.imgPublicId //delete img from cloudinary
            const deletedPost = await postModel.findByIdAndDelete(req.params.id)
            if(publicId){
                await deleteFromCloudinary(publicId)
            }
            res.status(200).json({msg: "post deletion done",...deletedPost})
        } 
        catch (error) {
            console.log(error)
            res.status(400).json({msg: "failed  to delete post"})
        }
    } else{
        res.status(400).json({msg: "cant delete another ones post"})
    }
})

//like or unlike a post
postRouter.put('/:id/like',async(req,res)=>{

    try {
        const postToLike = await postModel.findById(req.params.id)
        if (!postToLike.likes.includes(req.body.userId)) {
          await postToLike.updateOne({ $push: { likes: req.body.userId } });
          res.status(200).json("The post has been liked");
        } 
        else {
          await postToLike.updateOne({ $pull: { likes: req.body.userId } });
          res.status(200).json("The post has been unliked");
        }
    } 
    catch (err) {
        res.status(500).json(err);
    }

})

//bookmark or unBookmark a post
postRouter.put('/:id/bookmark',async(req,res)=>{

    try {
        const postToBookmark = await postModel.findById(req.params.id)
        if (!postToBookmark.bookmarks.includes(req.body.userId)) {
          await postToBookmark.updateOne({ $push: { bookmarks: req.body.userId } });
          res.status(200).json("The post has been liked");
        } 
        else {
          await postToBookmark.updateOne({ $pull: { bookmarks: req.body.userId } });
          res.status(200).json("The post has been unliked");
        }
    } 
    catch (err) {
        res.status(500).json(err);
    }

})

//get all post
postRouter.get('/',async(req,res)=>{

        try {
            const posts = await postModel.find({}).sort({createdAt:-1})
            return res.status(200).json(posts)
        } 
        catch (error) {
            console.log(error)
            return res.status(400).json({msg: "try again"})
        }
})

//get a post
postRouter.get('/:id',async(req,res)=>{

        try {
            const post = await postModel.findById(req.params.id)
            res.status(200).json(post)
        } catch (error) {
            console.log(error)
            res.status(400).json({msg: "try again"})
        }
})

//get liked or bookmarked posts
postRouter.get('/likes/:type/:id',async(req,res)=>{
    const userId = req.params.id
    const type = req.params.type
    try {
        const response = type==="likes" ? await postModel.find({likes:userId})
                                        : await postModel.find({bookmarks:userId})
        res.status(200).json(response)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

//get timeline posts
postRouter.get("/timeline/:userId", async (req, res) => {

    try {

      const currentUser = await userModel.findById(req.params.userId);
      const userPosts = await postModel.find({ userId : currentUser._id });
      
      const friendPosts = await Promise.all(
        currentUser.followings.map(async (friendId) => {
          return await postModel.find({ userId: friendId });
        })
      );
      res.status(200).json(userPosts.concat(...friendPosts));
    } 
    catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error", details: err });
    }
  });

//get all posts of a user
postRouter.get("/profile/:username",async(req, res) => {

    try {
        const currentUser = await userModel.findOne({username:req.params.username});
        const userPosts = await postModel.find({ userId:currentUser._id });
        res.status(200).json(userPosts);
    } catch (err) {
        res.status(500).json(err);
    } 
});
  
export default postRouter