/* eslint-disable no-use-before-define */
const models = require("../models");
const {
  Indicador,
  Tema,
  Formula,
  sequelize,
  Sequelize,
  Objetivo,
  IndicadorObjetivo,
  IndicadorTema,
  Cobertura,
  Ods,
  UsuarioIndicador,
  Usuario
} = models;
const { createRelation } = require("./usuarioIndicadorService");
const { updateIndicadorTemas } = require("./indicadorTemasService");
const { updateIndicadorObjetivos } = require("./indicadorObjetivosService");
const logger = require("../config/logger");
const { Op } = Sequelize;

const MAX_INDICADORES_PER_OBJETIVO = 5;


const getInactiveIndicadores = async () => {
  const indicadores = await Indicador.findAndCountAll({
    where: { activo: false },
    attributes: ["id", "nombre"],
    raw: true
  });
  return indicadores;
}



const createIndicador = async (indicador) => {
  const { temas = [], idObjetivo, ...values } = indicador;

  try {
    const result = await sequelize.transaction(async _t => {
      const created = await Indicador.create(
        values,
        {
          include: [
            {
              association: Indicador.associations.formula,
              include: [Formula.associations.variables]
            }, {
              association: Indicador.associations.mapa
            }]
        }
      );
      await assignIndicadorToObjetivo(created.id, idObjetivo)
      await assignIndicadorToTemas(created.id, temas)
      await assignIndicadorToUsuario(created.id, indicador.createdBy)
      return created;
    })

    return result;
  } catch (err) {
    console.log(err)
    logger.error(err.stack)
    throw new Error(`Error al crear indicador: ${err.message}`);
  }
};

const assignIndicadorToUsuario = async (idIndicador, idUsuario) => {
  return createRelation(
    [idUsuario], [idIndicador], {
    fechaDesde: null,
    fechaHasta: null,
    updatedBy: idUsuario,
    createdBy: idUsuario,
    expires: 'NO'
  })
}

const assignIndicadorToTemas = async (idIndicador, idTemas) => {
  return IndicadorTema.bulkCreate(
    idTemas.map(idTema => ({ idTema, idIndicador })), {
    ignoreDuplicates: true,
    validate: true
  })
}


const assignIndicadorToObjetivo = async (idIndicador, idObjetivo) => {
  return IndicadorObjetivo.create({
    idIndicador,
    idObjetivo,
  })
}


const updateIndicadorStatus = async (id) => {
  try {
    const prevActivo = await getIndicadorStatus(id);
    await Indicador.update({ activo: !prevActivo }, { where: { id } });
  } catch (err) {
    throw new Error(`Error al actualizar indicador: ${err.message}`);
  }
};


const getIndicadorStatus = async (id) => {
  const { activo } = await Indicador.findOne({ where: { id }, attributes: ["activo"], raw: true });
  return activo;
}


const updateIndicador = async (id, indicador) => {
  const { temas = [], objetivos = [], ...values } = indicador;

  try {
    sequelize.transaction(async _t => {

      if (temas.length > 0) {
        const temasIds = temas.map(tema => tema.id);
        await updateIndicadorTemas(id, temasIds);
      }

      if (objetivos.length > 0) {
        const objetivosIds = objetivos.map(objetivo => objetivo.id);
        await updateIndicadorObjetivos(id, objetivosIds);
      }

      await Indicador.update(values, { where: { id } });
    })

    return;
  } catch (err) {
    throw new Error(`Error al actualizar indicador: ${err.message}`);
  }
};


const getIdIndicadorRelatedTo = async (model, id) => {
  const indicador = await models[model].findOne({
    where: { id },
    attributes: [[sequelize.literal('"indicador"."id"'), "indicadorId"]],
    include: {
      model: Indicador,
      attributes: []
    },
    raw: true
  });
  return indicador?.indicadorId;
}


const getRandomIndicador = async (idTema) => {
  const indicadores = await Indicador.findAll({
    where: { idTema: idTema, activo: true },
    attributes: ["id"],
    raw: true
  });

  const indicadorId = indicadores[Math.floor(Math.random() * indicadores.length)];

  const indicador = await Indicador.findOne({
    where: { id: indicadorId.id },
    include: [
      {
        model: Objetivo,
        as: "objetivos",
        attributes: ["titulo"]
      },
      {
        model: Tema,
        attributes: ["urlImagen"]
      }
    ],
  });

  return indicador;
}


const includeAndFilterByObjetivos = (filterValues, attributes) => {
  const { idObjetivo = null, destacado = null, objetivos = [] } = filterValues || {};

  const ids = [idObjetivo, ...objetivos].filter(o => o);

  return {
    model: Objetivo,
    as: 'objetivos',
    required: true,
    ...(attributes !== undefined && { attributes }),
    where: {
      ...(ids.length > 0 && {
        id: ids
      })
    },
    through: {
      as: 'more',
      model: IndicadorObjetivo,
      attributes: [],
      ...(destacado !== null && {
        where: { destacado }
      })
    },
  };
}


const includeAndFilterByTemas = (filterValues, attributes) => {
  const { idTema = null, temas = [] } = filterValues || {};

  const ids = [idTema, ...temas].filter(t => t);

  return {
    model: Tema,
    required: true,
    ...(attributes !== undefined && { attributes }),
    ...(ids.length > 0 && {
      where: {
        id: ids
      }
    }),
    through: {
      model: IndicadorTema,
      attributes: [],
    }
  };
}


const includeAndFilterByUsuarios = (filterValues, attributes) => {
  const { idUsuario = null, owner = null, usuarios = [], isOwner = null } = filterValues || {};
  const ids = [idUsuario, owner, ...usuarios].filter(u => u);

  return {
    model: Usuario,
    required: true,
    as: 'usuarios',
    ...(attributes !== undefined && { attributes }),
    through: {
      model: UsuarioIndicador,
      attributes: [],
      where: {
        ...(ids.length > 0 && { idUsuario: ids }),
        ...(isOwner !== null && { isOwner }),
      }
    }
  }
}

const filterByUsuarios = (filterValues = {}) => {
  const { idUsuario = null, owner = null, usuarios = [], isOwner = null } = filterValues || {};
  const ids = [idUsuario, owner, ...usuarios].filter(u => u);

  return {
    model: Usuario,
    as: 'usuarios',
    required: true,
    attributes: [],
    through: {
      model: UsuarioIndicador,
      attributes: [],
      where: {
        ...(ids.length > 0 && { idUsuario: ids }),
      },
    }
  }
}


const includeResponsible = (attributes) => {
  return {
    model: Usuario,
    as: 'responsable',
    required: false,
    ...(attributes !== undefined && { attributes }),
    through: {
      model: UsuarioIndicador,
      attributes: [],
      where: { isOwner: true }
    }
  }
}



const includeAndFilterByODS = (filterValues, attributes) => {
  const { ods = [] } = filterValues || {};

  return {
    model: Ods,
    required: false,
    ...(attributes !== undefined && { attributes }),
    ...(ods.length > 0 && {
      where: {
        id: ods
      }
    })
  };
}


const includeAndFilterByCobertura = (filterValues, attributes) => {
  const { coberturas = [] } = filterValues || {};
  return {
    model: Cobertura,
    required: false,
    ...(attributes !== undefined && { attributes }),
    ...(coberturas.length > 0 && {
      where: {
        id: {
          [Op.in]: coberturas
        }
      }
    })
  };
}


module.exports = {
  createIndicador,
  updateIndicador,
  updateIndicadorStatus,
  getInactiveIndicadores,
  getIdIndicadorRelatedTo,
  getRandomIndicador,
  MAX_INDICADORES_PER_OBJETIVO,
  includeAndFilterByObjetivos,
  includeAndFilterByTemas,
  includeAndFilterByODS,
  includeAndFilterByCobertura,
  includeAndFilterByUsuarios,
  includeResponsible,
  filterByUsuarios
};