const jwt= require('jsonwebtoken');
const SECRET_KEY= process.env.SECRET_KEY;

const generateToken= (user) => {
    return jwt.sign({id: user.id, email: user.email}, SECRET_KEY, {expiresIn: '7d'});
}

const verifyToken= (req, res, next) => {
    const token= req.headers.authorization?.split(' ')[1];
    if(!token){
        return res.status(401).json({message: 'No token provided'});
    }
    try{
        const decoded= jwt.verify(token, SECRET_KEY);
        req.auth= () => ({userId: decoded.id, email: decoded.email});
        next();
    }
    catch(error){
        res.status(401).json({message: 'Invalid token'});
    }
}


module.exports= {generateToken, verifyToken};