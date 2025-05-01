const express = require('express')
const { createUser, getAllUser } = require('../controller/userContoller')
const routes = express.Router()

routes.post('/registerForm', createUser)
routes.get('/getAll', getAllUser)

module.exports = routes

