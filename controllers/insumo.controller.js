const express = require("express");
const Insumos = require("../models/Insumo");


const createInsumo = async(req, res) => {
    const { body } = req
    try {
        const checkInsumo = await Insumos.findOne({nombre: body.nombre});
        if (checkInsumo) return res.status(403).send("¡Insumo existente!");

        const insumo = await Insumos.create({
            nombre: body.nombre,
            precio: body.precio,
            descripcion: body.descripcion
        });

        const msj = "Insumo creado exitosamente."
        res.status(201).send({insumo, msj});

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

const updateInsumo = async(req, res) => {
    const { body } = req
    console.log(body)
    const insumo = await Insumos.updateOne({_id: body._id},
        {
            $set: {
                precio: body.precio,
                descripcion: body.descripcion
            }
        }     
    );
    console.log(insumo);
    res.status(200).send("Insumo modificado exitosamente.");
};

const listaInsumos = async(req, res) => {
    const insumos = await Insumos.find();
    res.status(200).send(insumos);
};

module.exports = {createInsumo, updateInsumo, listaInsumos};

