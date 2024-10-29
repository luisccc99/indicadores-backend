const temaService = require('../services/temaService');
const { Tema } = require('../models');
const logger = require('../config/logger');
const { getImagePathLocation } = require('../utils/stringFormat');

const getTemas = async (req, res, next) => {
  try {
    const { perPage, page, ...otherParams } = req.matchedData;
    const { temas, total } = await temaService.getAllTemas(page, perPage, otherParams);

    return res.status(200).json({ data: temas, total, totalPages: Math.ceil(total / perPage) });
  } catch (err) {
    next(err);
  }
};


const createTema = async (req, res, next) => {
  const values = req.matchedData;
  const image = getImagePathLocation(req);
  try {
    if (await temaService.isTemaIndicadorAlreadyInUse(values.temaIndicador)) {
      return res.status(409).json({
        status: 409,
        message: `${values.temaIndicador} is already in use`,
      });
    }
    const savedTema = await temaService.addTema({ ...values, ...image });
    return res.status(201).json({ data: savedTema });
  } catch (err) {
    next(err);
  }
};


const getAllTemas = async (req, res, next) => {
  const page = req.matchedData.page || 1;
  const perPage = req.matchedData.perPage || 15;
  try {
    const { temas, total, totalInactivos } = await temaService.getAllTemas(page, perPage, req.matchedData);
    const totalPages = Math.ceil(total / perPage);
    return res.status(200).json({
      page,
      perPage,
      totalPages,
      total,
      totalInactivos,
      data: temas
    });
  } catch (err) {
    next(err);
  }
};


const editTema = async (req, res, next) => {
  const { idTema, ...fields } = req.matchedData;
  const image = getImagePathLocation(req);
  try {
    const updatedTema = await temaService.updateTema(idTema, { ...fields, ...image });
    if (updatedTema) {
      return res.sendStatus(204);
    }
    return res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}


const editUserStatus = async (req, res, next) => {
  const { idTema } = req.matchedData;
  try {
    const updated = await temaService.updateTemaStatus(idTema);
    if (updated) {
      return res.sendStatus(204);
    }
    return res.sendStatus(400)
  } catch (err) {
    next(err);
  }
};


const getTema = async (req, res, next) => {
  const { idTema } = req.matchedData;

  try {
    const tema = await Tema.findByPk(idTema);

    if (tema === null) {
      return res.sendStatus(404);
    }
    if (tema.activo === false) {
      return res.status(409).json({ status: 409, message: `El tema ${tema.temaIndicador} se encuentra inactivo` });
    }
    return res.status(200).json({ data: { ...tema.dataValues } });
  } catch (err) {
    next(err);
  }
}


module.exports = { getTemas, createTema, editTema, getAllTemas, updateTemaStatus: editUserStatus, getTema }