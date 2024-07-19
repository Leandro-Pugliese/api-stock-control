const express = require("express");
const Admins = require("../models/adminUser");
const Users = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middlewares para rutas con autenticación.
// User
const isAuthenticated = async (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) {
        return res.status(403).send('No se detecto un token en la petición.')
    }
    try {
        const {_id} = jwt.verify(token, process.env.JWT_CODE)
        const user = await Users.findOne({_id: _id});
        if (!user) {
            return res.status(403).send('Token inválido, no se encontro el usuario en la DB.')
        }
        req.user = user
        next()
    } catch (error) {
        return res.status(500).send(error)
    }
};

//Admin
const isAuthenticatedAdmin = async (req, res, next) => {
    const tokenAdmin = req.header("Authorization");
    if (!tokenAdmin) {
        return res.status(403).send('No se detecto un token en la petición.')
    }
    try {
        const {_id} = jwt.verify(tokenAdmin, process.env.JWT_CODE_ADM)
        const user = await Admins.findOne({_id: _id});
        if (!user) {
            return res.status(403).send('Token inválido, no se encontro el usuario ADM en la DB.')
        }
        req.user = user
        next();
    } catch (error) {
        return res.status(500).send(error);
    }
};
module.exports = { isAuthenticated, isAuthenticatedAdmin }