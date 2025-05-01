const express = require("express");
const app = express();
require("dotenv/config");
const { PORT } = process.env;
const port = PORT;
const dataBase = require("./config/configDb");
const routes = require("./routes/userRoutes");
const cors = require("cors");
const morgan = require('morgan')

app.use(express.json());
app.use(cors());
app.use(morgan('dev'))
dataBase();

app.use("/api", routes);

app.all('/', (req, res) => {
    return res.status(500).json({message: "API is up and running"})
})

app.listen(port, () => {
  console.log(`Listening to Port: ${port}`);
});
