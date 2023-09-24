const express = require("express");
const Users = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config()
//---------------------------------------------------------------------------
// No usamos esta libreria, pero podemos usarla para decodificar el token
//const jwt_decode = require("jwt-decode");
//---------------------------------------------------------------------------

// Función para firmar el token.
const signToken =  (_id, email) => jwt.sign({_id, email}, process.env.JWT_CODE);

// Middleware para rutas con autenticación requerida. --------------------------------------------------
const validateToken = jwt.verify(signToken(), process.env.JWT_CODE, {expiresIn: "1d"});

const findAndAssingUser = async (req, res) => {
    try {
        const user = await Users.findById(req.user._id);
        if (!user) return res.status(401).end();
        req.user = user
        next();
    } catch (error) {
        next(error);    
    }
};

const isAuthenticated = express.Router().use(validateToken, findAndAssingUser);
// -----------------------------------------------------------------------------------------------------


const createUser = async (req, res) => {
    const { body } = req
    try {
        const isUser = await Users.findOne({username: body.username});
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
            username: body.username,
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
    const { body } = req
    
    const { email } = jwt.decode(body.token, {complete: true}).payload;
    
    // Decodificar token con otra libreria 
    //const decoded = jwt_decode(body.token)
    
    const userFind = await Users.findOne({email: body.email});

    if (email !== body.email || !userFind) return res.status(403).send("Correo inválido.");

    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(body.password, salt);

    const user = await Users.updateOne({email: body.email}, 
        {
            $set: {
                password: hashed, salt
            }
        })
        console.log(user);
        res.status(201).send("La contraseña ha sido modificada exitosamente.");
};

const usersList = async (req, res) => {
    const users = await Users.find();
    res.status(200).send(users);
};


module.exports = {createUser, loginUser, updateUser, usersList, isAuthenticated};