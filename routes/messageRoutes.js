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

export default messageRouter
