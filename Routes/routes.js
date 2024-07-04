const express = require("express");
const router =  express.Router();
const {isAuthenticated} = require("../Authentication/authentication");
const {createUser, loginUser, updateUser, usersList} = require("../controllers/user.controller");
const {createProducto, updateProductoStock, updateProductoComponentes, listaProductosAll} = require("../controllers/producto.controller");
const {createInsumo, updateInsumo, listaInsumos} = require("../controllers/insumo.controller");


// Rutas Usuario.
router.post("/usuario/crear", createUser);
router.post("/usuario/login", loginUser);
router.put("/usuario/update", isAuthenticated, updateUser);
router.get("/usuarios", isAuthenticated, usersList);

// Rutas Productos.
router.post("/producto/crear", isAuthenticated, createProducto);
router.put("/producto/update-stock", isAuthenticated, updateProductoStock);
router.put("/producto/update-componentes", isAuthenticated, updateProductoComponentes);
router.get("/productos", isAuthenticated, listaProductosAll);

// Rutas Insumos.
router.post("/insumo/crear", isAuthenticated, createInsumo);
router.put("/insumo/update", isAuthenticated, updateInsumo);
router.get("/insumos", isAuthenticated ,listaInsumos);

module.exports = router


