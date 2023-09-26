const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema ({
    sku: {
        type: String,
        require: true,
        unique: true
    },
    stock: {
        type: [Object],
        required: true,
    },
    maquina: String,
    componentes: {
        type: Object,
        required: true,
    },
    categoria: String,
    descripcion: String
}, {versionKey: false});

const Producto = mongoose.model("Producto", productoSchema);

module.exports = Producto