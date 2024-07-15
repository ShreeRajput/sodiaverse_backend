import express from 'express'
import mongoose from 'mongoose'
import authRouter from './routes/auth.js'
import userRouter from './routes/userRoutes.js'
import postRouter from './routes/postRoutes.js'
import cors from 'cors';
import dotenv from 'dotenv';
import conversationRouter from './routes/conversationRoutes.js'
import messageRouter from './routes/messageRoutes.js'

dotenv.config();
const app = express()
const port = process.env.PORT || 8000

// Enable CORS middleware for any origin
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

mongoose.connect(process.env.MONGO_URL)
    .then( ()=>{
        app.listen(port , ()=> {
            console.log("server is active on "+ port)
            console.log("connected to mongodb")
        } )
    })
    .catch((error)=>{
        console.log(error)
        console.log("not able to connect with db")
    })

//middlewares

app.use(express.json())

app.use('/api/users',userRouter)
app.use('/api/auth', authRouter)
app.use('/api/posts',postRouter)
app.use('/api/conversation',conversationRouter)
app.use('/api/message',messageRouter)

app.get('/',(req,res)=>{
    res.send("Hello this root api")
})
