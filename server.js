import express from "express";
import cors from "cors";
import 'dotenv/config';
import aiRouter from "./routes/aiRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send("Server is running"));

app.use(requireAuth());

app.use('/api/ai', aiRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);   
});
