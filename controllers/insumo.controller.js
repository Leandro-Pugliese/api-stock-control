const express = require("express");
const Insumos = require("../models/Insumo");

const createInsumo = async(req, res) => {
    const { body } = req
    try {
        const nombreEnMayusculas = body.nombre.toUpperCase()
        const checkInsumo = await Insumos.findOne({nombre: nombreEnMayusculas});
        if (checkInsumo) return res.status(403).send("¡Insumo existente!");
        const insumo = await Insumos.create({
            nombre: nombreEnMayusculas,
            precio: body.precio,
            descripcion: body.descripcion
        });
        const msj = "Insumo cargado exitosamente."
        res.status(201).send({insumo, msj});
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

const updateInsumo = async(req, res) => {
    const { body } = req
    try {
        await Insumos.updateOne({_id: body._id},
            {
                $set: {
                    precio: body.precio,
                    descripcion: body.descripcion
                }
            }     
        );
        res.status(200).send("Insumo modificado exitosamente.");
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const listaInsumos = async(req, res) => {
    try {
        const insumos = await Insumos.find();
        res.status(200).send(insumos);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {createInsumo, updateInsumo, listaInsumos};

