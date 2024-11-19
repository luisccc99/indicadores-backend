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

const MAX_INDICADORES_DESTACADOS_PER_OBJETIVO = 5;


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
      await assignOwnerToIndicador(indicador.createdBy, created.id)
      return created;
    })

    return result;
  } catch (err) {
    console.log(err)
    logger.error(err.stack)
    throw new Error(`Error al crear indicador: ${err.message}`);
  }
};

const assignOwnerToIndicador = async (idUsuario, idIndicador) => {
  return createRelation(
    [idUsuario], [idIndicador], {
    fechaDesde: null,
    fechaHasta: null,
    updatedBy: idUsuario,
    createdBy: idUsuario,
    expires: 'NO',
    isOwner: true,
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


const updateIndicador = async (id, values) => {
  const { temas = [], objetivos = [], ..._values } = values;

  try {
    sequelize.transaction(async _t => {
      if (temas.length > 0) {
        await updateIndicadorTemas(id, temas.map(tema => tema.id));
      }

      if (objetivos.length > 0) {
        await updateIndicadorObjetivos(id, objetivos.map(objetivo => objetivo.id));
      }

      await Indicador.update(_values, { where: { id } });
    })

    return;
  } catch (err) {
    logger.error(err)
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


const updateDestacadoStatusOfIndicadorInObjetivos = async (idIndicador, objetivosWithDestacadoStatus) => {
  try {
    await sequelize.transaction(_t = async () => {
      for (const objetivo of objetivosWithDestacadoStatus) {
        await IndicadorObjetivo.update({
          destacado: objetivo.destacado
        }, {
          where: {
            idIndicador,
            idObjetivo: objetivo.id
          }
        })
      }
    })
  } catch (err) {
    logger.error(err)
    throw new Error('Hubo un error al destacar indicador en objetivos')
  }

}


/**
 * Verifies Indicador is related to all Objetivos in objetivosDestacados, throws error if they're not related
 * @param {number} idIndicador 
 * @param {number[]} objetivosToDestacar 
 */
const verifyIndicadorHasRelationWithObjetivos = async (idIndicador, objetivosToDestacar) => {
  const relatedObjetivos = await Objetivo.findAll({
    attributes: ['id', 'titulo'],
    where: { id: objetivosToDestacar },
    include: {
      model: Indicador,
      attributes: [],
      where: {
        id: idIndicador,
      },
      through: {
        model: IndicadorObjetivo,
        attributes: [],
      }
    },
    raw: true,
  })

  if (relatedObjetivos.length === objetivosToDestacar.length) return;
  const notRelated = []
  for (const objetivo of objetivosToDestacar) {
    if (relatedObjetivos.find(o => o.id === objetivo)) continue;
    notRelated.push(objetivo)
  }
  const notRelatedObjetivos = await Objetivo.findAll({
    attributes: ['titulo'],
    where: { id: notRelated }
  })
  const titulos = notRelatedObjetivos.map(o => `'${o.titulo}'`).join(', ')
  const objetivoWord = notRelated.length > 1 ? notRelated.length + ' objetivos' : 'objetivo'
  const message = `Indicador no está relacionado con ${objetivoWord} ${titulos}. Asigna indicador a estos objetivos antes de destacarlo.`
  throw new Error(message)
}


const getDestacadosCountPerObjetivo = async (objetivos, idIndicador) => {
  return IndicadorObjetivo.findAll({
    attributes: [
      'idObjetivo',
      [sequelize.literal('"objetivo"."titulo"'), 'titulo'],
      [sequelize.fn('COUNT', 'destacado'), 'destacadosCount']
    ],
    where: {
      idObjetivo: objetivos,
      destacado: true,
      idIndicador: {
        [Op.notIn]: [idIndicador]
      }
    },
    include: {
      model: Objetivo,
      attributes: [],
    },
    group: ['idObjetivo', 'titulo'],
    raw: true
  })
}


const getIndicadoresDestacados = async (objetivos) => {
  const objetivosWithCount = await Objetivo.findAll({
    attributes: ['id', 'titulo'],
    where: {
      id: objetivos,
    },
    include: [{
      model: Indicador,
      attributes: ['id', 'nombre'],
      through: {
        model: IndicadorObjetivo,
        attributes: ['destacado'],
        where: {
          destacado: true
        }
      }
    }]
  })

  return objetivosWithCount
}


const getObjetivosStatusForIndicador = (idIndicador) => {
  return IndicadorObjetivo.findAll({
    attributes: [
      [sequelize.literal('"objetivo"."id"'), 'idObjetivo'],
      [sequelize.literal('"objetivo"."titulo"'), 'titulo'],
      'destacado'
    ],
    where: {
      idIndicador
    },
    include: [{
      model: Objetivo,
      attributes: []
    }],
    raw: true
  })
}


module.exports = {
  createIndicador,
  updateIndicador,
  updateIndicadorStatus,
  getInactiveIndicadores,
  getIdIndicadorRelatedTo,
  getRandomIndicador,
  MAX_INDICADORES_DESTACADOS_PER_OBJETIVO,
  includeAndFilterByObjetivos,
  includeAndFilterByTemas,
  includeAndFilterByODS,
  includeAndFilterByCobertura,
  includeAndFilterByUsuarios,
  includeResponsible,
  filterByUsuarios,
  verifyIndicadorHasRelationWithObjetivos,
  getDestacadosCountPerObjetivo,
  updateDestacadoStatusOfIndicadorInObjetivos,
  getIndicadoresDestacados,
  getObjetivosStatusForIndicador
};