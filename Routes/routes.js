const express = require("express");
const router =  express.Router();
const {isAuthenticated, isAuthenticatedAdmin} = require("../Authentication/authentication");
const {createAdmin, loginAdmin, habilitarUsuario, quitarUsuarioHabilitado, updateAdmin, usersList, bloquearUsuario, borrarUsuario} = require("../controllers/admin.controller");
const {createUser, loginUser, updateUser} = require("../controllers/user.controller");
const {createProducto, updateProductoStock, updateProductoComponentes, updateProductoCategoria, listaProductosAll, productoData} = require("../controllers/producto.controller");
const {createInsumo, updateInsumo, listaInsumos, insumoData} = require("../controllers/insumo.controller");


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
// Rutas Productos.(Usuario)
router.post("/producto/crear", isAuthenticated, createProducto);
router.put("/producto/update-stock", isAuthenticated, updateProductoStock);
router.put("/producto/update-componentes", isAuthenticated, updateProductoComponentes);
router.put("/producto/update-categoria", isAuthenticated, updateProductoCategoria);
router.get("/productos", isAuthenticated, listaProductosAll);
router.post("/producto", isAuthenticated, productoData);
// Rutas Productos.(Admin)
router.post("/producto/crear-admin", isAuthenticatedAdmin, createProducto);
router.put("/producto/update-stock-admin", isAuthenticatedAdmin, updateProductoStock);
router.put("/producto/update-componentes-admin", isAuthenticatedAdmin, updateProductoComponentes);
router.put("/producto/update-categoria-admin", isAuthenticatedAdmin, updateProductoCategoria);
router.get("/productos-admin", isAuthenticatedAdmin, listaProductosAll);
router.post("/producto-admin", isAuthenticatedAdmin, productoData);
// Rutas Insumos.(Usuario)
router.post("/insumo/crear", isAuthenticated, createInsumo);
router.put("/insumo/update", isAuthenticated, updateInsumo);
router.get("/insumos", isAuthenticated, listaInsumos);
router.post("/insumo", isAuthenticated, insumoData);
// Rutas Insumos.(Admin)
router.post("/insumo/crear-admin", isAuthenticatedAdmin, createInsumo);
router.put("/insumo/update-admin", isAuthenticatedAdmin, updateInsumo);
router.get("/insumos-admin", isAuthenticatedAdmin ,listaInsumos);
router.post("/insumo-admin", isAuthenticatedAdmin, insumoData);

module.exports = router


