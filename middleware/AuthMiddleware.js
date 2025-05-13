const jwt = require('jsonwebtoken');
requried("dotenv").config()

exports.adminAuth = (req,res, next) =>{
    try{
        const token = req.header("Authorization")

        if(!token){
            return res.status(401).json({
                message:"unaothorized, no token provided"
            });
        }

         const decoded = jwt.verify(token.replace("bearer", ""),process.env.JWT_SECRET);

         if(!decoded.role !== "admin"){
            return res.status(403).json({message:"forbidden, you are not an admin"})
         }

         req.admin = decoded;
         next();
    }catch(err){
        return res.status(401).json({
            message:"unauthorized, invalid toked",
            error:err.message
        })
    }
}