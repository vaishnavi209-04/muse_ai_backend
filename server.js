import express from "express";
import cors from "cors";
import 'dotenv/config';
import aiRouter from "./routes/aiRoutes.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import { clerkMiddleware, requireAuth } from '@clerk/express'

const app = express();
app.use(cors({
  origin: ["https://muse-ai.vercel.app", "http://localhost:5173"],
  credentials: true,
}));

app.use(clerkMiddleware())

await connectCloudinary();

app.use(express.json());

app.get('/', (req, res) => res.send("Server is running"));

app.use(requireAuth());

app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);   
});
