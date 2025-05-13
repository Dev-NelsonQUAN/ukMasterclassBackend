const express = require('express');
const { login } = require('../controller/adminAuth');
const adminRouter = express.Router();

adminRouter.post("/login", login);

module.exports = adminRouter;