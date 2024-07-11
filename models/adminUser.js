const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true
    },
    empresa: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    usuariosHabilitados: {
        type: [],
        require: true
    },
    pin : {
        type: String,
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

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin