const mongoose = require("mongoose");

const insumoSchema = new mongoose.Schema ({
    nombre: {
        type: String,
        required: true,
        unique: true
    },
    precio: {
        type: Number,
        required: true
    },
    descripcion: String
}, {versionKey: false});

const Insumo = mongoose.model("Insumo", insumoSchema);

module.exports = Insumo