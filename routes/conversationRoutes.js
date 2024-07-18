import express from "express"
import conversationModel from "../models/conversationModel.js"

const conversationRouter = express.Router()

//new conv
conversationRouter.post('/',async(req,res)=> {
    try {
        const conv1 = [req.body.senderId,req.body.receiverId]
        const conv2 = [req.body.receiverId,req.body.senderId]

        const resp = await conversationModel.find({$or:[{members:conv1},{members:conv2}]})
        if (resp.length > 0) {
            return res.status(409).json({ msg: "Conversation Already Exists!" , conv : resp});
        }

        const newConv = new conversationModel({
            members : [req.body.senderId,req.body.receiverId]
        })
        const response = await newConv.save()
        res.status(201).json(response)
    } 
    catch (error) {
        console.log(error);
        res.status(500).json({ msg : "server error occured!" });
    }
})

//get conv
conversationRouter.get('/:id',async(req,res)=> {
    const id = req.params.id
    try {
        const response = await conversationModel.find({members: id})
        res.status(200).json(response)
    } 
    catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

//delete all covs of a user
conversationRouter.delete('/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        await conversationModel.deleteMany({ members: userId }); // Use deleteMany to delete all matching documents
        res.status(200).json({ msg: "Conversations deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error occurred while deleting conversations" });
    }
})

export default conversationRouter