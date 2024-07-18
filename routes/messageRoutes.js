import express from "express" 
import messageModel from "../models/messageModel.js"

const messageRouter = express.Router()

//post new message
messageRouter.post('/',async(req,res)=> {
   
    try {
        const newMessage = new messageModel(req.body)
        const response = await newMessage.save()
        res.status(200).json(response)
    } 
    catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

//get message
messageRouter.get('/:convId',async(req,res)=> {

    const convId = req.params.convId
    try {
        const response = await messageModel.find({"conversationId":convId})
        res.status(200).json(response)
    } 
    catch (error) {
        console.log(error)
        res.status(200).json(response)
    }
})

//delete all messages of a user
messageRouter.delete('/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        await messageModel.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }); // Use deleteMany to delete all matching documents
        res.status(200).json({ msg: "Messages deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error occurred while deleting messages" });
    }
})

export default messageRouter
