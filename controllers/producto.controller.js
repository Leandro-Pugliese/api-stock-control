const express = require("express");
const Productos = require("../models/Product");


const createProducto = async(req, res) => {
    const { sku, stock, componentes, categoria, descripcion } = req.body;
    try {
        const skuEnMayusculas = sku.toUpperCase();
        const checkSku = await Productos.exist({sku: skuEnMayusculas});
        if (checkSku) return res.status(403).send("Sku existente.");
        const producto = await Productos.create({
            sku: skuEnMayusculas,
            stock,
            componentes,
            categoria,
            descripcion
        });
        const msj = "Producto cargado exitosamente."
        return res.status(201).send({producto, msj});
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const updateProductoStock = async(req, res) => { //Sirve tanto para modificar cantidades de stock como para agregar colores nuevos.
    const { sku, operacion, color, cantidad } = req.body;
    try {
        const skuEnMayusculas = sku.toUpperCase();
        const producto = await Productos.findOne({sku: skuEnMayusculas});
        if (!producto) {
            return res.status(403).send("Producto no encontrado en la base de datos.");
        }
        let productoStock = [...producto.stock];
        // Filtramos por el color.
        const filtroPorColor = productoStock.filter((elemento) => elemento.color === color);
        if (operacion === "ADD") {
            // Busco si el color existe en el stock o hay que añadirlo.
            if (filtroPorColor.length === 0) {
                const nuevoObjetoStock = {
                    color: color,
                    unidades: cantidad
                }
                productoStock.push(nuevoObjetoStock);
            } else if (filtroPorColor.length === 1) { // Si existe, modifico solo la cantidad.
                const objetoStockModificado = {
                    color: filtroPorColor[0].color,
                    unidades: filtroPorColor[0].unidades + cantidad
                }
                for (let indice in productoStock){
                    let objOriginal = productoStock[indice];
                    if (objOriginal.color === objetoStockModificado.color) {
                        productoStock.splice(indice, 1, objetoStockModificado);
                    }
                }
            } else {
                return res.status(403).send("Error en el filtrado de color del producto.");
            }
        } else if (operacion === "REMOVE") {
            // Busco si el color existe o no.
            if (filtroPorColor.length === 0) { // Si no existe no puedo modificarlo por ende error.
                return res.status(403).send("No se encontró el color indicado en el stock del producto.");
            }
            else if (filtroPorColor.length === 1) { //Si existe (si queda en 0 lo dejo cargado igual no elimino el color de la base de datos).
                // Reviso que no quede negativo el stock y modifico cantidades.
                const resta = filtroPorColor[0].unidades - cantidad;
                if (resta >= 0) {
                    const objetoStockModificado = {
                        color: filtroPorColor[0].color,
                        unidades: resta
                    }
                    for (let indice in productoStock){
                        let objOriginal = productoStock[indice];
                        if (objOriginal.color === objetoStockModificado.color) {
                            productoStock.splice(indice, 1, objetoStockModificado);
                        }
                    }
                } else {
                    return res.status(403).send("No tienes la cantidad necesaria del producto para realizar la operación.");
                }
            } else {
                return res.status(403).send("Error en el filtrado de color del producto.");
            }
        } else {
            return res.status(403).send("El tipo de operación no esta definido correctamente.");
        }
        // Hacemos el update del producto con la lista de productoStock actualizada.
        await Productos.updateOne({sku: skuEnMayusculas},
            {
                $set: {
                    stock: productoStock
                }
            }     
        );
        return res.status(200).send("Producto modificado exitosamente.");
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const updateProductoComponentes = async(req, res) => {
    const {sku, operacion, insumo, cantidad} = req.body;
    try {
        const skuEnMayusculas = sku.toUpperCase();
        const producto = await Productos.findOne({sku: skuEnMayusculas});
        if (!producto) {
            return res.status(403).send("Producto no encontrado en la base de datos.");
        }
        let componentesProducto = [...producto.componentes];
        // Filtro por componente.
        const filtroPorComponente = componentesProducto.filter((elemento) => elemento.insumo === insumo);
        if (operacion === "ADD") {
            // Busco si el componente existe o hay que añadirlo.
            if (filtroPorComponente.length === 0) { 
                const nuevoObjetoComponente = {
                    insumo: insumo,
                    cantidad: cantidad
                }
                componentesProducto.push(nuevoObjetoComponente);
            } else if (filtroPorComponente.length === 1) { // Si existe, modifico solo la cantidad.
                const objetoComponenteModificado = {
                    insumo: filtroPorComponente[0].insumo,
                    cantidad: filtroPorComponente[0].cantidad + cantidad
                }
                for (let indice in componentesProducto){
                    let objOriginal = componentesProducto[indice];
                    if (objOriginal.insumo === objetoComponenteModificado.insumo) {
                        componentesProducto.splice(indice, 1, objetoComponenteModificado);
                    }
                }
            } else {
                return res.status(403).send("Error en el filtrado de componente del producto.");
            }
        } else if (operacion === "REMOVE") {
            // Busco el si el componente existe o no.
            if (filtroPorComponente.length === 0) {
                return res.status(403).send("No se encontró el insumo indicado en los componentes del producto.");
            }
            else if (filtroPorComponente.length === 1) { //Si existe.
                // Reviso que no quede negativo el stock y modifico cantidades.
                const resta = filtroPorComponente[0].cantidad - cantidad;
                let redondeoResta = parseFloat(resta.toFixed(2));
                if (redondeoResta >= 0.01) {
                    const objetoComponenteModificado = {
                        insumo: filtroPorComponente[0].insumo,
                        cantidad: redondeoResta
                    }
                    for (let indice in componentesProducto){
                        let objOriginal = componentesProducto[indice];
                        if (objOriginal.insumo === objetoComponenteModificado.insumo) {
                            componentesProducto.splice(indice, 1, objetoComponenteModificado);
                        }
                    }
                } else { //En este caso solo quito el componente del array de componentes.
                    for (let indice in componentesProducto){
                        let objOriginal = componentesProducto[indice];
                        if (objOriginal.insumo === insumo) {
                            componentesProducto.splice(indice, 1);
                        }
                    }
                }
            } else {
                return res.status(403).send("Error en el filtrado de componente del producto.");
            }
        } else {
            return res.status(403).send("El tipo de operación no esta definido correctamente.");
        }
        // Hacemos el update del producto con la lista de componentes actualizada.
        await Productos.updateOne({sku: skuEnMayusculas},
            {
                $set: {
                    componentes: componentesProducto
                }
            }
        );
        return res.status(201).send("Componente del producto modificado exitosamente.");
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const updateProductoCategoria = async(req, res) => {
    const {sku, categoria, descripcion} = req.body;
    try {
        const skuEnMayusculas = sku.toUpperCase();
        const producto = await Productos.exists({sku: skuEnMayusculas});
        if (!producto) {
            return res.status(403).send("Producto no encontrado en la base de datos.");
        }
        await Productos.updateOne({sku: skuEnMayusculas},
            {
                $set: {
                    categoria,
                    descripcion
                }
            }
        );
        return res.status(200).send("Producto modificado exitosamente.");
    } catch (error) {
        return res.status(500).send(error.message);
    }
} 

const listaProductosAll = async(req, res) => {
    try {
        const productos = await Productos.find();
        return res.status(200).send(productos);
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const productoData = async(req, res) => {
    const {sku} = req.body;
    try {
        const skuEnMayusculas = sku.toUpperCase();
        const producto = await Productos.findOne({sku: skuEnMayusculas});
        if (!producto) {
            return res.status(403).send("Producto no encontrado en la base de datos.");
        }
        return res.status(200).send(producto);
    } catch (error) {
        return res.status(500).send(error.message);
    }
} 

module.exports = {createProducto, updateProductoStock, updateProductoComponentes, updateProductoCategoria, listaProductosAll, productoData};