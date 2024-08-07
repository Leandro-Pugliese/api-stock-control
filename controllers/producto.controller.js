const express = require("express");
const Productos = require("../models/Product");


const createProducto = async(req, res) => {
    const { body } = req; //Sku, stock[{obj}], componentes[{obj}], categoria, descripcion
    try {
        const skuEnMayusculas = body.sku.toUpperCase();
        const checkSku = await Productos.findOne({sku: skuEnMayusculas});
        if (checkSku) return res.status(403).send("¡Sku existente!");
        const producto = await Productos.create({
            sku: skuEnMayusculas,
            stock: body.stock,
            componentes: body.componentes,
            categoria: body.categoria,
            descripcion: body.descripcion
        });
        const msj = "Producto cargado exitosamente."
        return res.status(201).send({producto, msj});
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const updateProductoStock = async(req, res) => { //Sirve tanto para modificar cantidades de stock como para agregar colores nuevos.
    const { body } = req //sku, operacion("ADD"/"REMOVE"), color(string), cantidad(Number)
    try {
        const skuEnMayusculas = body.sku.toUpperCase();
        const producto = await Productos.findOne({sku: skuEnMayusculas});
        if (!producto) {
            return res.status(403).send("Producto no encontrado en la base de datos.");
        }
        let productoStock = [...producto.stock];
        // Filtramos por el color.
        const filtroPorColor = productoStock.filter((elemento) => elemento.color === body.color);
        if (body.operacion === "ADD") {
            // Buscamos si el color existe en el stock del o hay que añadirlo.
            if (filtroPorColor.length === 0) { // Si no existe el color en el stock, creamos el obj nuevo y lo añadimos.
                const nuevoObjetoStock = {
                    color: body.color,
                    unidades: body.cantidad
                }
                productoStock.push(nuevoObjetoStock);
            } else if (filtroPorColor.length === 1) { // Si existe, modificamos solo la cantidad.
                const objetoStockModificado = {
                    color: filtroPorColor[0].color,
                    unidades: filtroPorColor[0].unidades + body.cantidad
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
        } else if (body.operacion === "REMOVE") {
            // Buscamos el si el color existe o no.
            if (filtroPorColor.length === 0) { // Si no existe no puedo modificarlo por ende error.
                return res.status(403).send("No se encontró el color indicado en el stock del producto.");
            }
            else if (filtroPorColor.length === 1) { //Si existe (si queda en 0 lo dejamos cargado igual no eliminamos el color de la base de datos).
                // Revisamos que no quede negativo el stock y modificamos cantidades.
                const resta = filtroPorColor[0].unidades - body.cantidad;
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
    const {body} = req; //sku, operacion("ADD"/"REMOVE"), insumo(String), Cantidad(Number)
    try {
        const skuEnMayusculas = body.sku.toUpperCase();
        const producto = await Productos.findOne({sku: skuEnMayusculas});
        if (!producto) {
            return res.status(403).send("Producto no encontrado en la base de datos.");
        }
        let componentesProducto = [...producto.componentes];
        // Filtramos por componente.
        const filtroPorComponente = componentesProducto.filter((elemento) => elemento.insumo === body.insumo);
        if (body.operacion === "ADD") {
            // Buscamos si el componente existe o hay que añadirlo.
            if (filtroPorComponente.length === 0) { // Si no existe el componente, creamos el obj nuevo y lo añadimos.
                const nuevoObjetoComponente = {
                    insumo: body.insumo,
                    cantidad: body.cantidad
                }
                componentesProducto.push(nuevoObjetoComponente);
            } else if (filtroPorComponente.length === 1) { // Si existe, modificamos solo la cantidad.
                const objetoComponenteModificado = {
                    insumo: filtroPorComponente[0].insumo,
                    cantidad: filtroPorComponente[0].cantidad + body.cantidad
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
        } else if (body.operacion === "REMOVE") {
            // Buscamos el si el componente existe o no.
            if (filtroPorComponente.length === 0) { // Si no existe no puedo modificarlo por ende error.
                return res.status(403).send("No se encontró el insumo indicado en los componentes del producto.");
            }
            else if (filtroPorComponente.length === 1) { //Si existe.
                // Revisamos que no quede negativo el stock y modificamos cantidades.
                const resta = filtroPorComponente[0].cantidad - body.cantidad;
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
                } else { //En este caso solo quitamos el componente del array de componentes.
                    for (let indice in componentesProducto){
                        let objOriginal = componentesProducto[indice];
                        if (objOriginal.insumo === body.insumo) {
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
    const {body} = req; //sku, categoria(String), descripcion(String)
    try {
        const skuEnMayusculas = body.sku.toUpperCase();
        const producto = await Productos.findOne({sku: skuEnMayusculas});
        if (!producto) {
            return res.status(403).send("Producto no encontrado en la base de datos.");
        }
        await Productos.updateOne({sku: skuEnMayusculas},
            {
                $set: {
                    categoria: body.categoria,
                    descripcion: body.descripcion
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
    const {body} = req; //sku
    try {
        const skuEnMayusculas = body.sku.toUpperCase();
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