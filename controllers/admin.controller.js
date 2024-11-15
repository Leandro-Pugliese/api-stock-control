const express = require("express");
const Admins = require("../models/adminUser");
const Users = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND);

// Función para firmar el token.
const signTokenAdm =  (_id, email) => jwt.sign({_id, email}, process.env.JWT_CODE_ADM);

const createAdmin = async (req, res) => {
    const { username, email, empresa, password, claveAdm } = req.body; 
    try {
        if (claveAdm !== process.env.CLAVE_ADM) {
            return res.status(403).send("No tienes autorización para crear un usuario administrador y/o la clave de creación de adm es inválida.");
        }
        const nombreEnMayusculas = username.toUpperCase();
        const emailEnMinusculas = email.toLowerCase();
        const isAdmin = await Admins.findOne({
            $or: [
                {username: nombreEnMayusculas},
                {email: emailEnMinusculas}
            ]
        });
        if (isAdmin) {
            if (isAdmin.username === nombreEnMayusculas) {
                return res.status(403).send("El nombre de usuario ya existe en la base de datos.");
            }
            if (isAdmin.email === emailEnMinusculas) {
                return res.status(403).send("El email ingresado pertenece a un usuario ya registrado.");
            }
        }
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(password, salt);
        const admin = await Admins.create({
            username: nombreEnMayusculas,
            email: emailEnMinusculas,
            empresa,
            usuariosHabilitados: [],
            password: hashed, 
            salt
        });
        const msj = "Usuario adminsitrador creado exitosamente.";
        return res.status(201).send({admin, msj});
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const loginAdmin = async (req, res) => {
    const { email, password } = req.body; 
    try {
        const emailEnMinusculas = email.toLowerCase();
        const admin = await Admins.findOne({email: emailEnMinusculas});
        if (!admin) {
            return res.status(403).send("El email y/o la contraseña son incorrectos.");
        } 
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
            const token = signTokenAdm(admin._id, admin.email);
            return res.status(200).send({ token, admin });
        } else {
            return res.status(403).send("El email y/o la contraseña son incorrectos.");
        }
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const habilitarUsuario = async (req, res) => {
    const { usuarioNombre, usuarioEmail, claveAcceso } = req.body; 
    try {
        const nombreEnMayusculas = usuarioNombre.toUpperCase();
        const emailEnMinusculas = usuarioEmail.toLowerCase();
        //Primero chequeo que no exista un admin con el email habilitado
        const adminCheck = await Admins.exist({"usuariosHabilitados.email": emailEnMinusculas});
        if (adminCheck) {
            return res.status(403).send("Otro administrador tiene habilitado un usuario con ese email.");
        }
        //Despues busco el admin en la base de datos
        const tokenAdmin = req.header("Authorization");
        if (!tokenAdmin) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const { _id } = jwt.decode(tokenAdmin, {complete: true}).payload;
        //Verifico si el admin ya tiene un usuario habilitado con ese username y esa clave de acceso (pueden repetirse entre admins pero no en el mismo)
        const admin = await Admins.findOne({_id: _id});
        if (!admin) {
            return res.status(403).send("Administrador no encontrado en la base de datos.");
        }
        const conflictoUsuario = admin.usuariosHabilitados.some(
            (usuario) => usuario.username === nombreEnMayusculas || usuario.claveAcceso === claveAcceso
        );
        if (conflictoUsuario) {
            return res.status(403).send("Ya tienes habilitado un usuario con ese nombre de usuario o clave de acceso ingresados.");
        }
        // Hasheamos la clave de acceso. (Seguridad extra, no es necesaria por ahora.)
        // const salt = await bcrypt.genSalt();
        // const hashedClave = await bcrypt.hash(claveAcceso, salt);
        const objetoUsuario = {
            username: nombreEnMayusculas,
            email: emailEnMinusculas,
            claveAcceso: claveAcceso,
        };
        await Admins.updateOne({_id: admin._id},
            {
                $push: {
                    usuariosHabilitados: objetoUsuario
                }
            }
        );
        const msj = "Usuario habilitado exitosamente."
        return res.status(200).send({msj, objetoUsuario});
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const quitarUsuarioHabilitado = async (req, res) => {
    const {usuarioEmail} = req.body;
    try {
        //Primero que todo verificamos si el usuario fue creado o no.
        const emailEnMinusculas = usuarioEmail.toLowerCase();
        const user = await Users.exists({email: emailEnMinusculas});
        if (user) {
            return res.status(403).send('El usuario ya fue creado, en caso de que quieras quitarlo de la lista de usuarios habilitados tienes que borrarlo primero.');
        }
        const tokenAdmin = req.header("Authorization");
        if (!tokenAdmin) {
            return res.status(403).send('No se detecto un token en la petición.');
        }
        const { _id } = jwt.decode(tokenAdmin, {complete: true}).payload;
        const admin = await Admins.findOne({_id: _id});
        if (!admin) {
            return res.status(403).send("Administrador no encontrado en la base de datos.");
        }
        // Quitamos el usuario y hacemos update de la nueva lista filtrada.
        const listaUsuariosFiltrada = admin.usuariosHabilitados.filter((usuario) => usuario.email !== emailEnMinusculas);
        await Admins.updateOne({_id: _id},
            {
                $set: {
                    usuariosHabilitados: listaUsuariosFiltrada
                }
            }
        );
        return res.status(200).send("Usuario deshabilitado exitosamente.");
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const updateAdmin = async (req, res) => {
    const { passwordActual, nuevaPassword } = req.body; 
    try {
        const tokenAdmin = req.header("Authorization");
        if (!tokenAdmin) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const { email } = jwt.decode(tokenAdmin, {complete: true}).payload;
        const admin = await Admins.findOne({email: email});
        if (!admin) return res.status(403).send("Token inválido.");
        const isMatch = await bcrypt.compare(passwordActual, admin.password);
        if (!isMatch) {
            return res.status(403).send("Contraseña actual inválida.");
        }
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(nuevaPassword, salt);
        await Admins.updateOne({email: email}, 
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

const usersList = async (req, res) => {
    try {
        const tokenAdmin = req.header("Authorization");
        if (!tokenAdmin) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const { _id } = jwt.decode(tokenAdmin, {complete: true}).payload;
        const users = await Users.find({admin: _id});
        const admin = await Admins.findOne({_id: _id});
        const usuariosHabilitadosPorAdm = [...admin.usuariosHabilitados];
        return res.status(200).send({users, usuariosHabilitadosPorAdm});
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const bloquearUsuario = async (req, res) => {
    const {body} = req; //usuarioID, bloqueo(true/false), pin
    try {
        const tokenAdmin = req.header("Authorization");
        if (!tokenAdmin) {
            return res.status(403).send('No se detecto un token en la petición.');
        }
        const { _id } = jwt.decode(tokenAdmin, {complete: true}).payload;
        const admin = await Admins.findOne({_id: _id});
        if (!admin) {
            return res.status(403).send('Administrador no encontrado en la base de datos.');
        }
        const pinMatch = await bcrypt.compare(body.pin, admin.pin);
        if (!pinMatch) {
            return res.status(403).send("Pin inválido.");
        }
        const user = await Users.findOne({_id: body.usuarioID});
        if (!user) {
            return res.status(403).send('Usuario no encontrado en la base de datos.');
        }
        if (admin._id.toString() !== user.admin) {
            return res.status(403).send('Solo puedes bloquear/desbloquear usuarios que hayas habilitado con este usuario administrador.');
        }
        if (body.bloqueo !== true) {
            if (body.bloqueo !== false) {
                return res.status(403).send('Error: tipo de bloqueo indefinido.');
            }
        }
        let estadoUsuario = "bloqueado"
        if (body.bloqueo === false) {
            estadoUsuario = "desbloqueado"
        }
        if (body.bloqueo === user.bloqueado) {
            return res.status(403).send(`El usuario ya se encuentra ${estadoUsuario}`);
        }
        const msj = `Usuario (${user.username}) ${estadoUsuario}`;
        await Users.updateOne({_id: user._id},
            {
                $set: {
                    bloqueado: body.bloqueo
                }
            }
        );
        return res.status(201).send(msj);
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const borrarUsuario = async (req, res) => {
    const {body} = req; //usuarioEmail, passwordAdmin, pin
    try {
        const tokenAdmin = req.header("Authorization");
        if (!tokenAdmin) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const { _id } = jwt.decode(tokenAdmin, {complete: true}).payload;
        const admin = await Admins.findOne({_id: _id});
        if (!admin) {
            return res.status(403).send('Administrador no encontrado en la base de datos.');
        }
        const pinMatch = await bcrypt.compare(body.pin, admin.pin);
        if (!pinMatch) {
            return res.status(403).send("Pin inválido.");
        }
        const passwordMatch = await bcrypt.compare(body.passwordAdmin, admin.password);
        if (!passwordMatch) {
            return res.status(403).send("Contraseña inválida.");
        }
        const user = await Users.findOne({email: body.usuarioEmail});
        if (!user) {
            return res.status(403).send('Usuario no encontrado en la base de datos.');
        }
        if (admin._id.toString() !== user.admin) {
            return res.status(403).send('Solo puedes borrar usuarios que hayas habilitado con este usuario administrador.');
        }
        if (user.bloqueado === false) {
            return res.status(403).send('Para borrar un usuario primero tienes que bloquearlo.');
        }
        await Users.deleteOne({ _id: user._id });
        return res.status(200).send(`Usuario (${user.username}) eliminado exitosamente.`);
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const recuperarPassword = async (req, res) => {
    const { body } = req; //email
    try {
        const emailEnMinusculas = body.email.toLowerCase();
        const admin = await Admins.findOne({email: emailEnMinusculas});
        if (!admin) {
            return res.status(403).send("El email ingresado no pertenece a un usuario registrado en la base de datos.");
        } 
        const payload = {
            id:admin._id
        }
        const nuevoToken = jwt.sign(payload, process.env.JWT_CODE_ADM, {expiresIn: '10m'});
        const link = `${admin._id}/${nuevoToken}`;
        const { error } = await resend.emails.send({
            from: 'Stock Control <soporte_stockControl@leandro-pugliese.com>',
            to: [emailEnMinusculas],
            subject: 'Restablecer contraseña Stock Control',
            html: ` <p>Ingresa en el siguiente link para recuperar la contraseña: <a href="http://localhost:3000/recuperar-password/${link}">Click Aqui</a></p>
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

const generarPassword = async (req, res) => {
    const { id, token} = req.params
    try {
        const admin = await Admins.findOne({ _id: id })
        if (!admin) {
            return res.status(403).send("Credenciales inválidas");
        }
        const newPassword = Math.random().toString(36).replace(/[^a-z]+/g, '')
        jwt.verify(token, process.env.JWT_CODE_ADM);
        const salt = await bcrypt.genSalt()
        const hashed = await bcrypt.hash(newPassword, salt)
        await Admins.updateOne({ _id: id },
            {
                $set: {
                    password: hashed, salt
                }
            }
        )
        const { error } = await resend.emails.send({
            from: 'Stock Control <soporte_stockControl@leandro-pugliese.com>',
            to: [admin.email],
            subject: 'Contraseña restaurada.',
            html: ` <b>Tu contraseña fue restablecida con éxito.</b>
                    <br><p>Tu nueva contraseña es:<b> ${newPassword}</b></p>
                    <br><b><a href="http://localhost:3000/login-admin"> Click aqui para iniciar sesión </a></b>
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

module.exports = { createAdmin, loginAdmin, habilitarUsuario, quitarUsuarioHabilitado, updateAdmin, usersList, bloquearUsuario, borrarUsuario, recuperarPassword, generarPassword };