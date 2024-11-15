const express = require("express");
const Insumos = require("../models/Insumo");

const createInsumo = async(req, res) => {
    const { nombre, precio, descripcion } = req.body;
    try {
        const nombreEnMayusculas = nombre.toUpperCase();
        const checkInsumo = await Insumos.exists({nombre: nombreEnMayusculas});
        if (checkInsumo) {
            return res.status(403).send("¡Insumo existente!");
        }
        const insumo = await Insumos.create({
            nombre: nombreEnMayusculas,
            precio,
            descripcion
        });
        const msj = "Insumo cargado exitosamente."
        return res.status(200).send({insumo, msj});
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const updateInsumo = async(req, res) => {
    const {id} = req.params;
    const { precio, descripcion } = req.body;
    try {
        const checkInsumo = await Insumos.exists({_id: id});
        if (!checkInsumo) {
            return res.status(403).send("Insumo no encontrado en la base de datos.")
        };
        await Insumos.updateOne({_id: id},
            {
                $set: {
                    precio,
                    descripcion
                }
            }     
        );
        return res.status(200).send("Insumo modificado exitosamente.");
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const listaInsumos = async(req, res) => {
    try {
        const insumos = await Insumos.find();
        return res.status(200).send(insumos);
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

const insumoData = async(req, res) => {
    const {id} = req.params;
    try {
        const insumo = await Insumos.findOne({_id: id});
        if (!insumo) {
            return res.status(403).send("Insumo no encontrado en la base de datos.");
        }
        return res.status(200).send(insumo);
    } catch (error) {
        return res.status(500).send(error.message);
    }
} 

module.exports = {createInsumo, updateInsumo, listaInsumos, insumoData};

