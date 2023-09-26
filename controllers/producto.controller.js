const express = require("express");
const Productos = require("../models/Product");


const createProducto = async(req, res) => {
    const { body } = req
    try {
        const checkSku = await Productos.findOne({sku: body.sku});
        if (checkSku) return res.status(403).send("¡Sku existente!");

        const producto = await Productos.create({
            sku: body.sku,
            stock: body.stock,
            maquina: body.maquina,
            componentes: body.componentes,
            categoria: body.categoria,
            descripcion: body.descripcion
        });

        const msj = "Producto creado exitosamente."
        res.status(201).send({producto, msj});

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

const updateProducto = async(req, res) => {
    const { body }= req
    const producto = await Productos.updateOne({_id: body._id},
        {
            $set: {
                stock: body.stock,
                componentes: body.componentes,
                categoria: body.categoria
            }
        }     
    );
    console.log(producto);
    res.status(200).send("Producto modificado exitosamente.");
};

const listaProductosAll = async(req, res) => {
    const productos = Productos.find();
    res.status(200).send(productos);
};

const listaProductosFiltrados = async(req, res) => {
    const { body } = req
    
    // Busqueda por Sku
    if (body.sku !== "" && body.stock === "" && body.componentes === "" && body.categoria === "") {
        const productoFiltradoSku = Productos.findOne({sku: body.sku});
        res.status(200).send(productoFiltradoSku);
    };
    
    // Busqueda por stock
    if (body.stock !== "" && body.sku === "" && body.componentes === "" && body.categoria === "") {
        const productos = Productos.find();
        if (body.stock === 0) {
            const filtroProductosStockNegativo = productos.filter(producto => producto.stock === body.stock);
            res.status(200).send(filtroProductosStockNegativo);
        } else {
            const filtroProductosStockPositivo = productos.filter(producto => producto.stock === body.stock);
            res.status(200).send(filtroProductosStockPositivo);
        }
    };

    // Busqueda por componentes
    if (body.componentes !== "" && body.sku === "" && body.stock === "" && body.categoria === "") {
        const productos = Productos.find();
        const filtroProductosComponentes = productos.filter(producto => producto.componentes === body.componentes);
        res.status(200).send(filtroProductosComponentes);
    };

    // Busqueda por categoria
    if (body.categoria !== "" && body.sku === "" && body.stock === "" &&  body.componentes === "") {
        const productos = Productos.find();
        const filtroProductosCategoria = productos.filter(producto => producto.categoria === body.categoria);
        res.status(201).send(filtroProductosCategoria);
    }
};

module.exports = {createProducto, updateProducto, listaProductosAll, listaProductosFiltrados};