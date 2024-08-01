const express = require("express");
const cors = require("cors");
require("dotenv").config();
const Router = require("./Routes/routes");
const {db} = require("./DataBase/db");
const app = express();

app.use(express.json());
app.use(cors());
app.use(Router)
db()
app.listen(process.env.PORT, () => console.log(`Server running at port: ${process.env.PORT}`));