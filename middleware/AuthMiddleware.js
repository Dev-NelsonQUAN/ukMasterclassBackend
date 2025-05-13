const jwt = require('jsonwebtoken');
require("dotenv").config();

exports.adminAuth = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized, no or malformed token provided",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check role
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden, not an admin" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized, invalid token",
      error: err.message,
    });
  }
};
