const express = require("express");
const Admins = require("../models/adminUser");
const Users = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND);

// Función para firmar el token.
const signToken =  (_id, email) => jwt.sign({_id, email}, process.env.JWT_CODE);

const createUser = async (req, res) => {
    const { body } = req; //username, email, password, claveAcceso
    try {
        const nombreEnMayusculas = body.username.toUpperCase()
        const emailEnMinusculas = body.email.toLowerCase();
        const isEmail = await Users.findOne({email: body.email});
        if (isEmail) {
            return res.status(403).send("El email ingresado pertenece a un usuario ya registrado.");
        }
        const listaAdmins = await Admins.find();
        const listaFiltrada = listaAdmins.filter(objetoPrincipal =>
            objetoPrincipal.usuariosHabilitados.some(usuario => usuario.email === emailEnMinusculas)
        );
        if (listaFiltrada.length === 0 || listaFiltrada.length >= 2) {
            return res.status(403).send("Error con el filtro del admin.");
        }
        const admin = listaFiltrada[0];
        const usuariosHabilitadosAdmin = [...admin.usuariosHabilitados];
        const usuarioHabilitado = usuariosHabilitadosAdmin.filter((usuario) => usuario.claveAcceso === body.claveAcceso);
        if (usuarioHabilitado.length === 0) {
            return res.status(403).send("No hay usuarios habilitados para la clave de acceso ingresada.");
        }
        if (usuarioHabilitado.length >= 2) {
            return res.status(403).send("Error: HAY MÁS DE 1 USUARIO HABILITADO CON LA MISMA CLAVE DE ACCESO.");
        }
        if (usuarioHabilitado[0].username !== nombreEnMayusculas) {
            return res.status(403).send("La clave de acceso no corresponde al nombre de usuario ingresado.");
        }
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(body.password, salt);
        const user = await Users.create({
            username: nombreEnMayusculas,
            email: emailEnMinusculas,
            admin: admin._id,
            bloqueado: false,
            password: hashed, salt
        });
        const msj = "Usuario creado exitosamente.";
        return res.status(201).send({msj, user});
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const loginUser = async (req, res) => {
    const { body } = req; //Email, password
    try {
        const emailEnMinusculas = body.email.toLowerCase();
        const user = await Users.findOne({email: emailEnMinusculas});
        if (!user) {
            return res.status(403).send("El email y/o la contraseña son incorrectos.");
        } 
        if (user.bloqueado === true) {
            return res.status(403).send("El usuario se encuentra bloqueado.");
        }
        const isMatch = await bcrypt.compare(body.password, user.password);
        if (!isMatch) {
            return res.status(403).send("El email y/o la contraseña son incorrectos.");
        } 
        const token = signToken(user._id, user.email);
        return res.status(200).send({ token, user });
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const updateUser = async (req, res) => {
    const { body } = req; //email, passwordActual, nuevaPassword
    try {
        const token = req.header("Authorization");
        if (!token) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const emailEnMinusculas = body.email.toLowerCase();
        const { email } = jwt.decode(token, {complete: true}).payload;
        const user = await Users.findOne({email: emailEnMinusculas});
        if (email !== emailEnMinusculas || !user) return res.status(403).send("Correo inválido.");
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
        return res.status(201).send("La contraseña ha sido modificada exitosamente.");
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const recuperarPass = async (req, res) => {
    const { body } = req; //email
    try {
        const emailEnMinusculas = body.email.toLowerCase();
        const user = await Users.findOne({email: emailEnMinusculas});
        if (!user) {
            return res.status(403).send("El email ingresado no pertenece a un usuario registrado en la base de datos.");
        } 
        const payload = {
            id:user._id
        }
        const nuevoToken = jwt.sign(payload, process.env.JWT_CODE, {expiresIn: '10m'});
        const link = `${user._id}/${nuevoToken}`;
        const { error } = await resend.emails.send({
            from: 'Stock Control <soporteStockControl@leandro-pugliese.com>',
            to: [emailEnMinusculas],
            subject: 'Restablecer contraseña Stock Control',
            html: ` <p>Ingresa en el siguiente link para recuperar la contraseña: <a href="http://localhost:3000/recuperar-pass/${link}">Click Aqui</a></p>
                    <br><p>¡Si no pediste el recupero de la contraseña ignora este email y avisa al staff lo antes posbile!</p>`,
        });
        if (error) {
            return res.status(403).send(error);
        }
        return res.status(200).send("Enviamos un link a tu email para que puedas recuperar la contraseña.")
    } catch (err) {
        return res.status(500).send(err.message);
    }
}

const generarPass = async (req, res) => {
    const { id, token} = req.params
    try {
        const user = await Users.findOne({ _id: id })
        if (!user) {
            return res.status(403).send("Credenciales inválidas");
        }
        const newPassword = Math.random().toString(36).replace(/[^a-z]+/g, '')
        jwt.verify(token, process.env.JWT_CODE);
        const salt = await bcrypt.genSalt()
        const hashed = await bcrypt.hash(newPassword, salt)
        await Users.updateOne({ _id: id },
            {
                $set: {
                    password: hashed, salt
                }
            }
        )
        const { error } = await resend.emails.send({
            from: 'Stock Control <soporteStockControl@leandro-pugliese.com>',
            to: [user.email],
            subject: 'Contraseña restaurada.',
            html: ` <b>Tu contraseña fue restablecida con éxito.</b>
                    <br><p>Tu nueva contraseña es:<b> ${newPassword}</b></p>
                    <br><b><a href="http://localhost:3000/login-usuario"> Click aqui para iniciar sesión </a></b>
                    <br><p>Te recomendamos cambiar nuevamente tu contraseña una vez que ingreses a tu cuenta por cuestiones de seguridad.</p>
                    <br><p>Te saluda atentamente el staff de Stock Control.</p>`
        });
        if (error) {
            return res.status(403).send(error);
        }
        return res.status(200).send("Te enviamos un email con la nueva contraseña");
    } catch (err) {
        return res.status(500).send(err.message);
    }
}


module.exports = { createUser, loginUser, updateUser, recuperarPass, generarPass };