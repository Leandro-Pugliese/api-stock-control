const express = require("express");
const router =  express.Router();
const {createUser, loginUser, updateUser, usersList, isAuthenticated} = require("../controllers/user.controller");
const {createProducto, updateProducto, listaProductosAll, listaProductosFiltrados} = require("../controllers/producto.controller");


// Rutas Usuario.
router.post("/usuario/crear", createUser);
router.post("/usuario/login", loginUser);
router.put("/usuario/update", isAuthenticated, updateUser);
router.get("/usuarios", isAuthenticated, usersList);

// Rutas Producto.
router.post("/producto/crear", isAuthenticated, createProducto);
router.put("/producto/update", isAuthenticated, updateProducto);
router.get("/productos", isAuthenticated, listaProductosAll);
router.post("/productos/filtro", isAuthenticated, listaProductosFiltrados);

module.exports = router


