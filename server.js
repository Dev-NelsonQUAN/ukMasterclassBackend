const express = require("express");
const app = express();
require("dotenv/config");
const { PORT } = process.env;
const port = PORT;
const dataBase = require("./config/configDb");
const routes = require("./routes/userRoutes");
const adminRouter = require("./routes/adminRoutes");
const cors = require("cors");
const morgan = require('morgan')

app.use(cors());
app.use(express.json());
app.use(morgan('dev'))
dataBase();

app.use("/api", routes);
app.use("/api/admin", adminRouter);

app.all('/', (req, res) => {
    return res.status(200).json({message: "API is up and running"})
})

app.listen(port, () => {
  console.log(`Listening to Port: ${port}`);
});
