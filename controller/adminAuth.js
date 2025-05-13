const jwt = require('jsonwebtoken');

exports.login = async (req, res)=>{
    try{
         const {email, password} = req.body;
         if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({email, role: "admin"},process.env.JWT_SECRET, {expiresIn: "1h"});
            return res.status(200).json({
                message: "Login successful",
                token,
                role: "admin"
            });
         }else{
            return res.status(401).json({
                message: "Invalid email or password"
            });
         }

    }catch(err){
        return res.status(500).json({
            message:"server error",
            error: err.message
        })
    }
}