import mongoose from "mongoose"

const postSchema = mongoose.Schema({

    userId : {
        type : String ,
        required : true ,
    },

    description : {
        type : String ,
        max : 500
    },

    img : {
        type : String ,
    },

    imgPublicId : {
        type : String,
        default : ''
    },

    location : {
        type : String,
    },

    tags : {
        type:String,
    },

    likes : {
        type : Array,
        default : []
    },

    bookmarks : {
        type : Array,
        default : []
    },

    comments : {
        type : Array,
        default : []
    }
    
},{timestamps : true})

const postModel = mongoose.model('Post',postSchema)
export default postModel