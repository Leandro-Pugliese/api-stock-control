const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema ({
    sku: {
        type: String,
        require: true,
        unique: true
    },
    stock: {
        type: Number,
        require: true
    },
    componentes: {
        type: Object,
        required: true,
        default: {}
    },
    categoria: String,
}, {versionKey: false});

const Producto = mongoose.model("Producto", productoSchema);

module.exports = Producto