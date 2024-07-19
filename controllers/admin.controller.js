const express = require("express");
const Admins = require("../models/adminUser");
const Users = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Función para firmar el token.
const signTokenAdm =  (_id, email) => jwt.sign({_id, email}, process.env.JWT_CODE_ADM);

const createAdmin = async (req, res) => {
    const { body } = req; //username, email, empresa, pin, password, claveAdm
    try {
        if (body.claveAdm !== process.env.CLAVE_ADM) {
            return res.status(403).send("No tienes autorización para crear un usuario administrador y/o la clave de creación de adm es inválida.");
        }
        const nombreEnMayusculas = body.username.toUpperCase()
        const isAdmin = await Admins.findOne({username: nombreEnMayusculas});
        if (isAdmin) {
            return res.status(403).send("El nombre de usuario ya existe en la base de datos.");
        }
        const emailEnMinusculas = body.email.toLowerCase();
        const isEmail = await Admins.findOne({email: emailEnMinusculas});
        if (isEmail) {
            return res.status(403).send("El email ingresado pertenece a un usuario ya registrado.");
        }
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(body.password, salt);
        const hashedPin = await bcrypt.hash(body.pin, salt);
        const admin = await Admins.create({
            username: nombreEnMayusculas,
            email: emailEnMinusculas,
            empresa: body.empresa,
            usuariosHabilitados: [],
            pin: hashedPin,
            password: hashed, salt
        });
        const msj = "Usuario adminsitrador creado exitosamente.";
        return res.status(201).send({admin, msj});
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const loginAdmin = async (req, res) => {
    const { body } = req; //email, password, pin
    try {
        const emailEnMinusculas = body.email.toLowerCase();
        const admin = await Admins.findOne({email: emailEnMinusculas});
        if (!admin) {
            return res.status(403).send("El email y/o la contraseña son incorrectos.");
        } 
        const isMatch = await bcrypt.compare(body.password, admin.password);
        if (isMatch) {
            const pinMatch = await bcrypt.compare(body.pin, admin.pin);
            if (!pinMatch) {
                return res.status(403).send("Pin incorrecto.");
            }
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
    const { body } = req; //usuarioNombre(usuario a habilitar), usuarioEmail(usuario a habilitar) claveAcceso(la que quiera el admin), pin(de la cta adm)
    try {
        const tokenAdmin = req.header("Authorization");
        if (!tokenAdmin) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const { _id } = jwt.decode(tokenAdmin, {complete: true}).payload;
        const admin = await Admins.findOne({_id: _id});
        if (!admin) {
            return res.status(403).send("Administrador no encontrado en la base de datos.");
        }
        const pinMatch = await bcrypt.compare(body.pin, admin.pin);
        if (!pinMatch) {
            return res.status(403).send("Pin incorrecto.");
        }
        //Armo el obj usuario que va a habilitar el adm.
        const nombreEnMayusculas = body.usuarioNombre.toUpperCase();
        const emailEnMinusculas = body.usuarioEmail.toLowerCase();
        //Verificamos si algún usuario ya esta registrado con ese email ya que el email es único. 
        //Posible mejora, el email podria ser único dentro de la empresa en caso de que haya un grupo poder tener dos usuarios en empresas distintas con el mismo email en la misa BD.
        const emailMatch = await Users.findOne({email: emailEnMinusculas});
        if (emailMatch) {
            return res.status(403).send("Ya existe un usuario en la base de datos con el email ingresado.");
        }
        const listaAdmins = await Admins.find();
        const listaFiltrada = listaAdmins.filter(objetoPrincipal =>
            objetoPrincipal.usuariosHabilitados.some(usuario => usuario.email === emailEnMinusculas)
        );
        if (listaFiltrada.length > 0) {
            return res.status(403).send("Ya existe un usuario habilitado con el email ingresado.");
        }
        // Filtramos para ver si este admin ya creo un usuario con ese username para que no pueda repetirlo. (pueden repetirse entre admins pero no en el mismo).
        const filtroUsernameEnAdmin = admin.usuariosHabilitados.filter((usuario) => usuario.username === nombreEnMayusculas);
        if (filtroUsernameEnAdmin.length >= 1) {
            return res.status(403).send("Ya tienes habilitado un usuario con el nombre de usuario ingresado.")
        }
        // Filtramos para no repetir claves de acceso entre los usuarios. (seguridad extra).
        const filtroClaveAccesoEnAdmin = admin.usuariosHabilitados.filter((usuario) => usuario.claveAcceso === body.claveAcceso);
        if (filtroClaveAccesoEnAdmin.length >= 1) {
            return res.status(403).send("Ya tienes habilitado un usuario con la clave de acceso ingresada.");
        }
        // Hasheamos la clave de acceso. (Seguridad extra, no es necesaria por ahora.)
        // const salt = await bcrypt.genSalt();
        // const hashedClave = await bcrypt.hash(body.claveAcceso, salt);
        const objetoUsuario = {
            username: nombreEnMayusculas,
            email: emailEnMinusculas,
            claveAcceso: body.claveAcceso,
        };
        let usuariosHabilitadosAdmin = [...admin.usuariosHabilitados];
        usuariosHabilitadosAdmin.push(objetoUsuario);
        await Admins.updateOne({_id: admin._id},
            {
                $set: {
                    usuariosHabilitados: usuariosHabilitadosAdmin
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
    const {body} = req; //usuarioEmail, pin
    try {
        //Primero que todo verificamos si el usuario fue creado o no.
        const emailEnMinusculas = body.usuarioEmail.toLowerCase();
        const user = await Users.findOne({email: emailEnMinusculas});
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
        const pinMatch = await bcrypt.compare(body.pin, admin.pin);
        if (!pinMatch) {
            return res.status(403).send("Pin incorrecto.");
        }
        const filtroUsuario = admin.usuariosHabilitados.filter((usuario) => usuario.email === emailEnMinusculas);
        if (filtroUsuario.length === 0 || filtroUsuario.length >= 2) {
            return res.status(403).send("Error con filtrado de usuario habilitado.");
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
    const { body } = req; //email, passwordActual, nuevaPassword, pin
    try {
        const tokenAdmin = req.header("Authorization");
        if (!tokenAdmin) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const { email } = jwt.decode(tokenAdmin, {complete: true}).payload;
        const emailEnMinusculas = body.email.toLowerCase();
        const admin = await Admins.findOne({email: emailEnMinusculas});
        if (email !== emailEnMinusculas || !admin) return res.status(403).send("Correo inválido.");
        const isMatch = await bcrypt.compare(body.passwordActual, admin.password);
        if (!isMatch) {
            return res.status(403).send("Contraseña actual inválida.");
        }
        const pinMatch = await bcrypt.compare(body.pin, admin.pin);
        if (!pinMatch) {
            return res.status(403).send("Pin inválido.");
        }
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(body.nuevaPassword, salt);
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
        const users = await Users.find();
        const usuariosCreadosPorAdm = users.filter((usuario) => usuario.admin === _id);
        const admin = await Admins.findOne({_id: _id});
        const usuariosHabilitadosPorAdm = [...admin.usuariosHabilitados];
        return res.status(200).send({usuariosCreadosPorAdm, usuariosHabilitadosPorAdm});
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
    const {body} = req; //usuarioID, passwordAdmin, pin
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
        const user = await Users.findOne({_id: body.usuarioID});
        if (!user) {
            return res.status(403).send('Usuario no encontrado en la base de datos.');
        }
        if (admin._id.toString() !== user.admin) {
            return res.status(403).send('Solo puedes borrar usuarios que hayas habilitado con este usuario administrador.');
        }
        await Users.deleteOne({ _id: user._id });
        return res.status(200).send(`Usuario (${user.username}) eliminado exitosamente.`);
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

module.exports = { createAdmin, loginAdmin, habilitarUsuario, quitarUsuarioHabilitado, updateAdmin, usersList, bloquearUsuario, borrarUsuario };