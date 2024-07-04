const express = require("express");
const Productos = require("../models/Product");


const createProducto = async(req, res) => {
    const { body } = req;
    try {
        const skuEnMayusculas = body.sku.toUpperCase();
        const checkSku = await Productos.findOne({sku: skuEnMayusculas});
        if (checkSku) return res.status(403).send("¡Sku existente!");
        const producto = await Productos.create({
            sku: skuEnMayusculas,
            stock: body.stock,
            maquina: body.maquina,
            componentes: body.componentes,
            categoria: body.categoria,
            descripcion: body.descripcion
        });
        const msj = "Producto creado exitosamente."
        res.status(201).send({producto, msj});
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const updateProductoStock = async(req, res) => {
    const { body } = req //OPERACION("ADD"/"REMOVE"), CANTIDAD(Number)
    try {
        const producto = await Productos.findOne({_id: body._id});
        if (!producto) {
            return res.status(403).send("Producto no encontrado en la base de datos.");
        }
        let objetoModificado = [];
        if (body.operacion === "ADD") {
            const nuevoObjetoStock = {
                color: producto.stock.color,
                unidades: producto.stock.unidades + body.cantidad
            }
            objetoModificado.push(nuevoObjetoStock);
        } else if (body.operacion === "REMOVE") {
            const resta = producto.stock.unidades - body.cantidad;
            if (resta >= 0) { //Chequeamos que no quede en negativo el stock.
                const nuevoObjetoStock = {
                    color: producto.stock.color,
                    unidades: producto.stock.unidades - body.cantidad
                }
                objetoModificado.push(nuevoObjetoStock);
            } else {
                return res.status(403).send("No tienes la cantidad necesaria del producto para realizar la operación.");
            }
        } else {
            return res.status(403).send("El tipo de operación no esta definido correctamente.");
        }
        await Productos.updateOne({_id: body._id},
            {
                $set: {
                    stock: objetoModificado[0]
                }
            }     
        );
        res.status(200).send("Producto modificado exitosamente.");
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const updateProductoComponentes = async(req, res) => {
    const {body} = req; //_id(del producto), componentes(obj)
    try {
        const producto = await Productos.findOne({_id: body._id});
        if (!producto) {
            return res.status(403).send("Producto no encontrado en la base de datos.");
        }
        await Productos.updateOne({},
            {
                $set: {
                    componentes: body.componentes
                }
            }
        );
        res.status(201).send("Componentes del producto modificados exitosamente.");
    } catch (error) {
        res.status(500).send(error.message);
    }
}

const listaProductosAll = async(req, res) => {
    try {
        const productos = await Productos.find();
        res.status(200).send(productos);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Por el momento vamos a filtrar en el front solamente.
// const listaProductosFiltrados = async(req, res) => {
//     const { body } = req 
//     // Busqueda por Sku
//     if (body.sku !== "" && body.stock === "" && body.categoria === "") {
//         const productoFiltradoSku = await Productos.findOne({sku: body.sku});
//         res.status(200).send(productoFiltradoSku);
//     };
    
//     // Busqueda por stock especifico
//     if (body.stock !== "" && body.stockEspecifico === "SI" && body.sku === "" && body.categoria === "") {
//         const productos = await Productos.find();
//         const filtro = []
//         productos.forEach(element =>  filtro.push(element.sku, element.stock.filter(data => data.Unidades === body.stock)))

//         const dividirArrayEnPares = (array) => {
//             const subArrays = [];
//             for (let i = 0; i < array.length; i += 2) {
//             subArrays.push(array.slice(i, i + 2));
//             }
//             return subArrays;
//         }
            
//         const arrayDividido = dividirArrayEnPares(filtro); 
//         const filtro2 = []
            
//         arrayDividido.forEach(element => {
//             if(element[1][0] !== undefined) {
//                 filtro2.push(element[0], element[1])
//             }
//         })
            
//         const arrayFinal = dividirArrayEnPares(filtro2)
//         res.status(200).send(arrayFinal)
//     };

//     // Busqueda por stock disponible
//     if (body.stockEspecifico === "NO" && body.sku === "" && body.categoria === "") {
//         const productos = await Productos.find();
//         const filtro = []
//         productos.forEach(element =>  filtro.push(element.sku, element.stock.filter(data => data.Unidades > 0)))

//         const dividirArrayEnPares = (array) => {
//             const subArrays = [];
//             for (let i = 0; i < array.length; i += 2) {
//             subArrays.push(array.slice(i, i + 2));
//             }
//             return subArrays;
//         }
            
//         const arrayDividido = dividirArrayEnPares(filtro); 
//         const filtro2 = []
            
//         arrayDividido.forEach(element => {
//             if(element[1][0] !== undefined) {
//                 filtro2.push(element[0], element[1])
//             }
//         })
            
//         const arrayFinal = dividirArrayEnPares(filtro2)
//         res.status(200).send(arrayFinal)
//     };

//     // Busqueda por categoría
//     if (body.categoria !== "" && body.sku === "" && body.stock === "" && body.stockEspecifico === "ND") {
//         const productos = await Productos.find();
//         const filtroProductosCategoria = productos.filter(producto => producto.categoria === body.categoria);
//         res.status(201).send(filtroProductosCategoria);
//     }

//     // Busqueda por categoría y stock especifico
//     if (body.categoria !== "" && body.sku === "" && body.stock !== "" && body.stockEspecifico === "SI") {
//         const productos = await Productos.find();
//         const filtro = []
//         const filtroProductosCategoria = productos.filter(producto => producto.categoria === body.categoria);
//         filtroProductosCategoria.forEach(element =>  filtro.push(element.sku, element.stock.filter(data => data.Unidades === body.stock)))

//         const dividirArrayEnPares = (array) => {
//             const subArrays = [];
//             for (let i = 0; i < array.length; i += 2) {
//               subArrays.push(array.slice(i, i + 2));
//             }
//             return subArrays;
//         }
          
//         const arrayDividido = dividirArrayEnPares(filtro); 
//         const filtro2 = []
        
//         arrayDividido.forEach(element => {
//             if(element[1][0] !== undefined) {
//                 filtro2.push(element[0], element[1])
//             }
//         })
        
//         const arrayFinal = dividirArrayEnPares(filtro2)
//         res.status(200).send(arrayFinal) 
//     }

//     // Busqueda por categoría y stock disponible
//     if (body.categoria !== "" && body.sku === "" && body.stockEspecifico === "NO") {
//         const productos = await Productos.find();
//         const filtro = []
//         const filtroProductosCategoria = productos.filter(producto => producto.categoria === body.categoria);
//         filtroProductosCategoria.forEach(element =>  filtro.push(element.sku, element.stock.filter(data => data.Unidades > 0)))

//         const dividirArrayEnPares = (array) => {
//             const subArrays = [];
//             for (let i = 0; i < array.length; i += 2) {
//               subArrays.push(array.slice(i, i + 2));
//             }
//             return subArrays;
//         }
          
//         const arrayDividido = dividirArrayEnPares(filtro); 
//         const filtro2 = []
        
//         arrayDividido.forEach(element => {
//             if(element[1][0] !== undefined) {
//                 filtro2.push(element[0], element[1])
//             }
//         })
        
//         const arrayFinal = dividirArrayEnPares(filtro2)
//         res.status(200).send(arrayFinal) 
//     }
// };

module.exports = {createProducto, updateProductoStock, updateProductoComponentes, listaProductosAll};