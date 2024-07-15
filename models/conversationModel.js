import mongoose from "mongoose"

const conversationSchema = mongoose.Schema({
    members : {
        type : Array
    },
},{timestamps:true});

const conversationModel = mongoose.model("Conversation",conversationSchema)
export default conversationModel