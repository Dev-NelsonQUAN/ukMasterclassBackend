const express = require("express")
const app = express()
require('dotenv/config')
const {PORT} = process.env
const port = PORT
const dataBase = require("./config/configDb")

dataBase()

app.listen(port, () => {
    console.log(`Listening to Port: ${port}`)
})