const mongoose = require("mongoose");
require("dotenv").config()
const url = process.env.MONGO

const db = () => {
    try {
        mongoose.connect(url);
        console.log("Database connected");
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = { db };

