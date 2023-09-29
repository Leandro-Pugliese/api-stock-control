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
    console.log(body)
    const producto = await Productos.updateOne({_id: body._id},
        {
            $set: {
                stock: body.stock
            }
        }     
    );
    console.log(producto);
    res.status(200).send("Producto modificado exitosamente.");
};

const listaProductosAll = async(req, res) => {
    const productos = await Productos.find();
    res.status(200).send(productos);
};

const listaProductosFiltrados = async(req, res) => {
    const { body } = req
    
    // Busqueda por Sku
    if (body.sku !== "" && body.stock === "" && body.categoria === "") {
        const productoFiltradoSku = await Productos.findOne({sku: body.sku});
        res.status(200).send(productoFiltradoSku);
    };
    
    // Busqueda por stock especifico
    if (body.stock !== "" && body.stockEspecifico === "SI" && body.sku === "" && body.categoria === "") {
        const productos = await Productos.find();
        const filtro = []
        productos.forEach(element =>  filtro.push(element.sku, element.stock.filter(data => data.Unidades === body.stock)))

        const dividirArrayEnPares = (array) => {
            const subArrays = [];
            for (let i = 0; i < array.length; i += 2) {
            subArrays.push(array.slice(i, i + 2));
            }
            return subArrays;
        }
            
        const arrayDividido = dividirArrayEnPares(filtro); 
        const filtro2 = []
            
        arrayDividido.forEach(element => {
            if(element[1][0] !== undefined) {
                filtro2.push(element[0], element[1])
            }
        })
            
        const arrayFinal = dividirArrayEnPares(filtro2)
        res.status(200).send(arrayFinal)
    };

    // Busqueda por stock disponible
    if (body.stockEspecifico === "NO" && body.sku === "" && body.categoria === "") {
        const productos = await Productos.find();
        const filtro = []
        productos.forEach(element =>  filtro.push(element.sku, element.stock.filter(data => data.Unidades > 0)))

        const dividirArrayEnPares = (array) => {
            const subArrays = [];
            for (let i = 0; i < array.length; i += 2) {
            subArrays.push(array.slice(i, i + 2));
            }
            return subArrays;
        }
            
        const arrayDividido = dividirArrayEnPares(filtro); 
        const filtro2 = []
            
        arrayDividido.forEach(element => {
            if(element[1][0] !== undefined) {
                filtro2.push(element[0], element[1])
            }
        })
            
        const arrayFinal = dividirArrayEnPares(filtro2)
        res.status(200).send(arrayFinal)
    };

    // Busqueda por categoría
    if (body.categoria !== "" && body.sku === "" && body.stock === "" && body.stockEspecifico === "ND") {
        const productos = await Productos.find();
        const filtroProductosCategoria = productos.filter(producto => producto.categoria === body.categoria);
        res.status(201).send(filtroProductosCategoria);
    }

    // Busqueda por categoría y stock especifico
    if (body.categoria !== "" && body.sku === "" && body.stock !== "" && body.stockEspecifico === "SI") {
        const productos = await Productos.find();
        const filtro = []
        const filtroProductosCategoria = productos.filter(producto => producto.categoria === body.categoria);
        filtroProductosCategoria.forEach(element =>  filtro.push(element.sku, element.stock.filter(data => data.Unidades === body.stock)))

        const dividirArrayEnPares = (array) => {
            const subArrays = [];
            for (let i = 0; i < array.length; i += 2) {
              subArrays.push(array.slice(i, i + 2));
            }
            return subArrays;
        }
          
        const arrayDividido = dividirArrayEnPares(filtro); 
        const filtro2 = []
        
        arrayDividido.forEach(element => {
            if(element[1][0] !== undefined) {
                filtro2.push(element[0], element[1])
            }
        })
        
        const arrayFinal = dividirArrayEnPares(filtro2)
        res.status(200).send(arrayFinal) 
    }

    // Busqueda por categoría y stock disponible
    if (body.categoria !== "" && body.sku === "" && body.stockEspecifico === "NO") {
        const productos = await Productos.find();
        const filtro = []
        const filtroProductosCategoria = productos.filter(producto => producto.categoria === body.categoria);
        filtroProductosCategoria.forEach(element =>  filtro.push(element.sku, element.stock.filter(data => data.Unidades > 0)))

        const dividirArrayEnPares = (array) => {
            const subArrays = [];
            for (let i = 0; i < array.length; i += 2) {
              subArrays.push(array.slice(i, i + 2));
            }
            return subArrays;
        }
          
        const arrayDividido = dividirArrayEnPares(filtro); 
        const filtro2 = []
        
        arrayDividido.forEach(element => {
            if(element[1][0] !== undefined) {
                filtro2.push(element[0], element[1])
            }
        })
        
        const arrayFinal = dividirArrayEnPares(filtro2)
        res.status(200).send(arrayFinal) 
    }
};

module.exports = {createProducto, updateProducto, listaProductosAll, listaProductosFiltrados};