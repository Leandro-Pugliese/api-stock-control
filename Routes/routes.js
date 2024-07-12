const express = require("express");
const router =  express.Router();
const {isAuthenticated, isAuthenticatedAdmin} = require("../Authentication/authentication");
const {createAdmin, loginAdmin, habilitarUsuario, quitarUsuarioHabilitado, updateAdmin, usersList, bloquearUsuario, borrarUsuario} = require("../controllers/admin.controller");
const {createUser, loginUser, updateUser} = require("../controllers/user.controller");
const {createProducto, updateProductoStock, updateProductoComponentes, listaProductosAll} = require("../controllers/producto.controller");
const {createInsumo, updateInsumo, listaInsumos} = require("../controllers/insumo.controller");


// Rutas Admin.
router.post("/admin/crear", createAdmin);
router.post("/admin/login", loginAdmin);
router.put("/admin/habilitar-usuario", isAuthenticatedAdmin, habilitarUsuario);
router.put("/admin/deshabilitar-usuario", isAuthenticatedAdmin, quitarUsuarioHabilitado);
router.put("/admin/update", isAuthenticatedAdmin, updateAdmin);
router.put("/admin/bloquear-usuario", isAuthenticatedAdmin, bloquearUsuario);
router.post("/admin/borrar-usuario", isAuthenticatedAdmin, borrarUsuario);
router.get("/usuarios", isAuthenticatedAdmin, usersList);

// Rutas Usuario.
router.post("/usuario/crear", createUser);
router.post("/usuario/login", loginUser);
router.put("/usuario/update", isAuthenticated, updateUser);

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


