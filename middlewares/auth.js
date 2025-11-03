const sql= require("../config/db.js");
const {verifyToken}= require("../services/auth.js");


const auth= async(req,res,next)=>{
    try{
        const authHeader= req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({message: 'Unauthorized'});
        }

        const token= authHeader.split(' ')[1];
        const decoded= verifyToken(token);           

        if(!decoded){
            return res.status(401).json({success: false, message: 'Invalid token'});
        }

         const [user] = await sql`SELECT * FROM users WHERE id = ${decoded.userId}`;
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const hasPremiumPlan= user.plan === 'premium';

        if(!hasPremiumPlan && user.free_usage >0){
            req.free_usage= user.free_usage;
        }
        else{
            await sql`UPDATE users SET free_usage = 0 WHERE id = ${decoded.userId}`;
            req.free_usage= 0;
        }

        req.user=user;
        req.plan= hasPremiumPlan ? 'premium' : 'free';

        next();
    }
    catch(error){
        console.log("Auth Middleware Error:", error);
        res.status(500).json({success: false, message: 'Authentication failed'});
    }
};

module.exports = { auth };