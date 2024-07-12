const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    admin: {
        type: String,
        require: true
    },
    bloqueado: {
        type: Boolean,
        require: true
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