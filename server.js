import express from "express";
import cors from "cors";
import 'dotenv/config';
import aiRouter from "./routes/aiRoutes.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import { clerkMiddleware, requireAuth } from '@clerk/express'

const app = express();

app.use(clerkMiddleware())

await connectCloudinary();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send("Server is running"));

app.use(requireAuth());

app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);   
});
