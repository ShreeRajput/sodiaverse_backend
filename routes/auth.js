import express from "express";
const authRouter = express.Router()
import {userModel} from "../models/userModel.js";
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer';
import crypto from 'crypto'
import { config } from 'dotenv';
config(); 
import { generateToken } from "../services/generateToken.js";

//Registration

const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email service
    auth: {
        user: process.env.EMAIL, // your email
        pass: process.env.PASSWORD // your email password
    }
});

const sendOTP = (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Email Verification OTP',
        text: `Your OTP for email verification is: ${otp}`
    };

    return transporter.sendMail(mailOptions)
};

authRouter.post( "/register" , async(req,res)=>{

    try { 
        const isEmailExists = await userModel.findOne({"email":req.body.email})
        if(isEmailExists)
            return res.status(400).json({"msg":"email already exists!"})
        const isUserExists = await userModel.findOne({"username":req.body.username})
        if(isUserExists)
            return res.status(400).json({"msg":"username already exists,try another!"})

        const otp = crypto.randomBytes(3).toString('hex'); // Generate a 6-digit OTP
        const hashedPass = await bcrypt.hash(req.body.password, 10);

        let newUser = new userModel( {
            ...req.body,
            password : hashedPass,
            otp,
            otpExpires: Date.now() + 3600000
        })       
        const storedUser = await newUser.save()

        await sendOTP(req.body.email, otp)
        res.status(200).json({ msg: "Registration successful! Please verify your email with the OTP sent to your email address." });      
    }
    catch (error) {
        console.log(error)
        res.status(400).json({msg : "reEnter the details for registration"})      
    }
})

//verify OTP 
authRouter.post('/verifyOtp',async(req,res)=>{
    try {
        const user = await userModel.findOne({ email: req.body.email });

        if (!user) {
            return res.status(400).json({ msg: "User not found!" });
        }

        if (user.otp !== req.body.otp || Date.now() > user.otpExpires) {
            await userModel.findByIdAndDelete(user._id)
            return res.status(400).json({ msg: "Invalid or expired OTP!" });
        }

        user.otp = undefined;
        user.otpExpires = undefined;
        user.isVerified = true
        await user.save();
        res.status(200).json({ msg: "Email verified successfully!" });

    } catch (error) {
        res.status(400).json({msg:"wrong code entered!"})
    }
})

//LOGIN
authRouter.post('/login', async(req,res)=>{

    const {email,password} = req.body
    try {
        const user = await userModel.findOne({"email": email})
        if(!user){
           return res.status(404).json({msg: "User do not found!"})
        } 
        
        if(user.isVerified===false){
            await userModel.findByIdAndDelete(user._id)
            return res.status(400).json({msg: "User is not verified!"})
        } else{
            let passCheck = await bcrypt.compare(password,user.password)
            if(passCheck){
                const details = {_id:user._id,username:user.username,email:user.email}
                const token = generateToken(details)
                res.status(200).json({'msg':"login successful!","token":token,"user":details})
            }else{
                res.status(400).json({msg: "Password is incorrect!"})
            }
        }
    } catch (error) {
        console.log(error)
        res.status(400).json({msg: "reSend the data"})
    }
})

authRouter.get('/forgotPass/:email',async(req,res)=>{
    try {
        const isUserExist = await userModel.findOne({email:req.params.email})
        if(!isUserExist)
            return res.status(400).json({"msg":"user not exists!"})

        //send verification code to email
        const otp = crypto.randomBytes(3).toString('hex');
        await sendOTP(req.params.email, otp)
        isUserExist.otp = otp
        isUserExist.otpExpires = Date.now() + 3600000
        await isUserExist.save()
        res.status(200).json({"msg":"otp has been sent to email"})
    } catch (error) {
        console.log(error)
        res.status(400).json({msg:"failed to send verifyCode"})
    }
})

authRouter.put('/reSetPass',async(req,res)=>{
    try {
        const user = await userModel.findOne({email:req.body.email})
        if(!user)
            return res.status(400).json({msg:"User not found!"})

        req.body.password = await bcrypt.hash(req.body.password,10)
        await userModel.updateOne({email:req.body.email},req.body)
        res.status(200).json({msg:"password reset done.."})
    } catch (error) {
        return res.status(400).json({msg:"password reset failed.."})
    }
})


export default authRouter