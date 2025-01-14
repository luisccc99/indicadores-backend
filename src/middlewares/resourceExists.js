const models = require('../models');

/**
 * 
 * @param {*} param0 
 * Verifies resource (Indicador, Usuario, etc) exists with id in routeParam, 
 * optionally verifies resource is activo
 * @returns 
 */
const verifyResourceExists = ({ routeParam, model, isActivo }) => async (req, res, next) => {
  const id = req.matchedData[routeParam];
  try {
    const attributes = ['id']
    if (isActivo !== undefined) {
      attributes.push('activo')
    }

    const result = await models[model].findOne({
      where: { id },
      raw: true,
      attributes
    });

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: `No se encontró el elemento (${model}) con id "${id}"`
      });
    }

    if (isActivo !== undefined && !result.activo) {
      return res.status(409).json({
        status: 409,
        message: `"${model}" con id "${id}" se encuentra inactivo`
      });
    }

    next();
  } catch (err) {
    next(err)
  }
};

module.exports = { verifyResourceExists }