const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    },
    salt: {
        type: String,
        require: true
    }
}, {versionKey: false});

const User = mongoose.model("User", userSchema);

module.exports = User