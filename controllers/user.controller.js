const express = require("express");
const Users = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config()

// Función para firmar el token.
const signToken =  (_id, email) => jwt.sign({_id, email}, process.env.JWT_CODE);

const createUser = async (req, res) => {
    const { body } = req
    try {
        const nombreEnMayusculas = body.username.toUpperCase()
        const isUser = await Users.findOne({username: nombreEnMayusculas});
        if (isUser) {
            return res.status(403).send("El nombre de usuario ya existe en la base de datos.");
        }
        const isEmail = await Users.findOne({email: body.email});
        if (isEmail) {
            return res.status(403).send("El email ingresado pertenece a un usuario ya registrado.");
        }
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(body.password, salt);
        const user = await Users.create({
            username: nombreEnMayusculas,
            email: body.email,
            password: hashed, salt
        });
        const msj = "Usuario creado exitosamente.";
        res.status(201).send({user, msj});
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

const loginUser = async (req, res) => {
    const { body } = req
    try {
        const user = await Users.findOne({email:body.email});
        if (!user) {
            res.status(403).send("El email y/o la contraseña son incorrectos.");
        } else {
            const isMatch = await bcrypt.compare(body.password, user.password);
            if (isMatch) {
                const token = signToken(user._id, user.email);
                res.status(200).send({token, user});
            } else {
                res.status(403).send("El email y/o la contraseña son incorrectos.");
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

const updateUser = async (req, res) => {
    const { body } = req; //email, passwordActual, nuevaPassword
    try {
        const token = req.header("Authorization");
        if (!token) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const { email } = jwt.decode(token, {complete: true}).payload;
        const user = await Users.findOne({email: body.email});
        if (email !== body.email || !user) return res.status(403).send("Correo inválido.");
        const isMatch = await bcrypt.compare(body.passwordActual, user.password);
        if (!isMatch) {
            return res.status(403).send("Contraseña actual inválida.");
        }
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(body.nuevaPassword, salt);
        await Users.updateOne({email: email}, 
            {
                $set: {
                    password: hashed, salt
                }
            }
        )
        res.status(201).send("La contraseña ha sido modificada exitosamente.");
    } catch (error) {
        res.status(500).send(error.message);
    }
}

const usersList = async (req, res) => {
    try {
        const users = await Users.find();
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
}

module.exports = { createUser, loginUser, updateUser, usersList };