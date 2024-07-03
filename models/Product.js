const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema ({
    sku: {
        type: String,
        require: true,
        unique: true
    },
    stock: {
        type: [],
        required: true,
    },
    maquina: String,
    componentes: {
        type: [],
        required: true,
    },
    categoria: String,
    descripcion: String
}, {versionKey: false});

const Producto = mongoose.model("Producto", productoSchema);

module.exports = Producto