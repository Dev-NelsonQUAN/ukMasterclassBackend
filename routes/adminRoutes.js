const express = require('express');
const { login } = require('../controller/adminAuth');
const { adminAuth } = require('../middleware/AuthMiddleware');
const adminRouter = express.Router();

adminRouter.post("/login",adminAuth, login);

module.exports = adminRouter;