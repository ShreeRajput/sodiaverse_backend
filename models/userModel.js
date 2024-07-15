import mongoose from "mongoose"

const userSchema = mongoose.Schema({

    username : {
        type : String ,
        required : true ,
        min : 4,
        unique : true
    },

    email : {
        type : String ,
        unique : true
    },

    password : {
        type : String ,
        required : true ,
        min : 7
    },

    isVerified : {
        type : Boolean,
        default : false
    },

    otp : {
        type : String
    },

    otpExpires : {
        type : Date
    },

    profilePicture : {
        type : String,
        default : ''
    },

    profilePicturePublicId : {
        type : String,
        default : ''
    },

    coverPicture : {
        type : String,
        default : ''
    },

    coverPicturePublicId : {
        type : String,
        default : ''
    },

    bio : {
        type: String,
        max: 160
    },

    city : {
        type: String,
    },

    birthday : {
        type: Date
    },

    socialLink : {
        type: String
    },

    followers : {
        type : Array,
        default : []
    },

    followings : {
        type : Array,
        default : []
    }

},{timestamps : true})

const userModel = mongoose.model('User',userSchema)
export {userModel}