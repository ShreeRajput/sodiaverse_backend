import express from 'express';
import mongoose from 'mongoose';
import authRouter from './routes/auth.js';
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import conversationRouter from './routes/conversationRoutes.js';
import messageRouter from './routes/messageRoutes.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS middleware for any origin
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Serve static files from the React app's build folder
app.use(express.static(path.join(__dirname, 'build')));

// Middleware to parse JSON
app.use(express.json());

// API Routes
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/api/conversation', conversationRouter);
app.use('/api/message', messageRouter);

app.get('/', (req, res) => {
    res.send("Hello, this is the root API");
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        app.listen(port, () => {
            console.log("Server is active on port " + port);
            console.log("Connected to MongoDB");
        });
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB", error);
    });
