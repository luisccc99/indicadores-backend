/* eslint-disable no-use-before-define */
const { QueryTypes, where } = require("sequelize");
const { SITE_PATH, FRONT_PATH, FILE_PATH } = require("../middlewares/determinePathway");
const models = require("../models");
const {
  Indicador,
  Tema,
  Historico,
  Mapa,
  Formula,
  Variable,
  sequelize,
  Sequelize,
  Catalogo,
  CatalogoDetail,
  CatalogoDetailIndicador,
  Objetivo,
  IndicadorObjetivo,
  IndicadorTema,
  Cobertura,
  Ods,
  UsuarioIndicador,
  Usuario
} = models;
const { updateOrCreateCatalogosFromIndicador, addCatalogosToIndicador } = require("./catalogosService");
const { createRelation } = require("./usuarioIndicadorService");
const { updateIndicadorTemas } = require("./indicadorTemasService");
const { updateIndicadorObjetivos } = require("./indicadorObjetivosService");
const { updateIndicadorMetas } = require("./indicadorMetasService");
const PublicIndicadorService = require("./publicIndicadorService");
const logger = require("../config/logger");
const usuariosService = require("./usuariosService");
const { Op } = Sequelize;

const LIMIT_NUMBER_INDICADORES_PER_OBJETIVO = 5;


// Sorting logic for list
const getIndicadoresSorting = ({ sortBy, order }) => {
  const arrangement = [];
  arrangement.push([sortBy || "id", order || "ASC"]);
  return arrangement;
};


const getInactiveIndicadores = async () => {
  const indicadores = await Indicador.findAndCountAll({
    where: { activo: false },
    attributes: ["id", "nombre"],
    raw: true
  });
  return indicadores;
}


/**
 * @deprecated
 */
const getIndicadores = async ({ page, perPage, filters }) => {
  const { where, order, attributes, include } = getDefinitionsForIndicadores(pathway, filters);
  const p = new PublicIndicadorService();
  try {
    const result = await Indicador.findAndCountAll({
      limit: perPage,
      offset: (page - 1) * perPage,
      where,
      order,
      include,
      attributes,
      distinct: true
    });

    return { indicadores: result.rows, total: result.count };
  } catch (err) {
    throw err;
  }
};


/**
 * @deprecated
 */
const findAllIndicadores = async (args) => {
  const { page, perPage = 25, offset, searchQuery, ...filters } = args;
  const { idObjetivo, destacado = false, activo = true, temas = [] } = filters;

  return Indicador.findAll({
    limit: perPage,
    offset: offset !== undefined ? offset : (page - 1) * perPage,
    attributes: [
      'id',
      'nombre',
      'tendenciaActual',
      'ultimoValorDisponible',
      'adornment',
      'idCobertura',
      'idOds',
      'unidadMedida',
      'anioUltimoValorDisponible',
      'updatedAt'
    ],
    where: {
      activo,
      ...(searchQuery && filterIndicadoresBySearchQuery(searchQuery)),
      ...filterIndicadoresBy(filters)
    },
    order: [
      ['updatedAt', 'desc'],
      ['id', 'asc']
    ],
    include: [
      {
        model: CatalogoDetail,
        as: 'catalogos',
        attributes: [
          'id',
          'nombre',
          'idCatalogo',
          [sequelize.literal('"catalogos->catalogo"."nombre"'), '_catalogo']
        ],
        required: false,
        include: {
          model: Catalogo,
          attributes: []
        },
        through: {
          model: CatalogoDetailIndicador,
          attributes: [],
        },
      },
      ...filterByCatalogos(filters),
      {
        model: Tema,
        required: true,
        attributes: ['id', 'temaIndicador', 'color', 'codigo'],
        where: {
          ...(temas.length > 0 && { id: temas })
        }
      },
      {
        model: Objetivo,
        as: 'objetivos',
        required: true,
        attributes: ['id', [sequelize.literal('"objetivos->more"."destacado"'), 'destacado']],
        where: {
          ...(idObjetivo !== undefined && { id: idObjetivo }),
        },
        through: {
          as: 'more',
          model: IndicadorObjetivo,
          attributes: [],
          where: {
            destacado
          }
        },
      }
    ],
  });

}


/**
 * @deprecated
 */
const filterIndicadoresBySearchQuery = (str) => {
  return {
    [Op.or]: [
      { nombre: { [Op.iLike]: `%${str}%` } },
      { definicion: { [Op.iLike]: `%${str}%` } },
      { codigo: { [Op.iLike]: `%${str}%` } },
    ]
  }
}


/**
 * 
 * @deprecated
 */
const countIndicadores = async ({ searchQuery, ...filters }) => {
  const { idObjetivo, destacado = null, temas } = filters;

  const count = await Indicador.count({
    where: {
      activo: true,
      ...(searchQuery && filterIndicadoresBySearchQuery(searchQuery))
    },
    include: [{
      model: Objetivo,
      as: 'objetivos',
      where: {
        ...(idObjetivo && { id: idObjetivo })
      },
      through: {
        as: 'more',
        model: IndicadorObjetivo,
        attributes: [],
        where: {
          ...(destacado !== null && { destacado })
        }
      },
    }, {
      model: Tema,
      required: true,
      attributes: ['id', 'temaIndicador', 'color', 'codigo'],
      where: {
        ...(temas && temas.length > 0 && { id: temas })
      }
    }]
  })
  return count;
}


/**
 * 
 * @deprecated
 */
const getDefinitionsForIndicadores = (sourceType, args) => {
  const attributes = getAttributesForIndicadores(sourceType)
  const filters = getFiltersForIndicadores(args);
  const order = defineOrder(sourceType, args);
  const where = defineWhere(sourceType, args);

  return {
    attributes,
    filters,
    order,
    where,
  };
};



/**
 * 
 * @deprecated
 */
const defineAttributes = (pathway, matchedData) => {
  const attributes = [
    "id",
    "nombre",
    'elif',
    "ultimoValorDisponible",
    "activo",
    "anioUltimoValorDisponible",
    "tendenciaActual",
    "fuente",
    "createdBy",
    "updatedAt",
    "periodicidad",
    "archive",
    "adornment",
    "unidadMedida",
    "idCobertura",
    "idOds"
  ];

  switch (pathway) {
    case FILE_PATH:
      attributes.push(
        "definicion",
      )
      return attributes;
    case SITE_PATH:
      if (matchedData) {
        attributes.push("createdAt", "updatedAt", "idTema")
      } else {
        attributes.push("definicion", "urlImagen")
      }
      return attributes;
    case FRONT_PATH:
      attributes.push(
        "activo",
        "definicion",
        "owner",
        "observaciones",
        "createdBy",
        "updatedBy",
        "idTema",
        "createdAt",
        "updatedAt",)
      return attributes;
    default:
      throw new Error('Invalid pathway');
  }
};


/**
 * 
 * @deprecated
 * @param {*} sourceRequest where does the requests come from? public (Chihuahua Metrica) or private (Admin app) sources
 */
const getAttributesForIndicadores = (sourceRequest) => {
  return [
    'id',
    'nombre',
    'tendenciaActual',
    'ultimoValorDisponible',
    'adornment',
    'unidadMedida',
    'anioUltimoValorDisponible',
    'updatedAt'
  ];
  return [
    'id',
    'nombre',
    'tendenciaActual',
    'ultimoValorDisponible',
    'definicion',
    'adornment',
    'unidadMedida',
    'anioUltimoValorDisponible',
    'updatedAt',
    'createdAt'
  ]
}


const defineOrder = (pathway, matchedData) => {
  const order = [];
  switch (pathway) {
    case SITE_PATH:
      order.push(getIndicadoresSorting(matchedData))
      return order;
    case FRONT_PATH:
      order.push(getIndicadoresSorting(matchedData))
      return order;
    default:
      throw new Error('Invalid pathway')
  };
};


/**
 * 
 * @deprecated
 */
const defineWhere = (pathway, matchedData) => {
  let where = {};

  switch (pathway) {
    case SITE_PATH:
      where = {
        ...filterIndicadoresBy(matchedData),
        ...getIndicadoresFilters(matchedData),
        ...advancedSearch(matchedData),
      };
      break;
    case FRONT_PATH:
      where = {
        ...getIndicadoresFilters(matchedData),
        ...advancedSearch(matchedData),
      }
      break;

    default:
      throw new Error('Invalid pathway')
  }
  return where;
};


/**
 * 
 * @deprecated
 */
const getIndicador = async (idIndicador, pathway) => {
  const includes = defineIncludesForAnIndicador(pathway);
  const attributes = defineAttributes(pathway);

  try {
    let indicador = await Indicador.findOne({
      where: { id: idIndicador, },
      include: includes,
      attributes,
    });

    if (pathway !== FILE_PATH || indicador === null) {

      //const { prevIndicador, nextIndicador } = await definePrevNextIndicadores(temaID, idIndicador);
      // indicador['prev'] = 2;
      // indicador['next'] = 3;
      return indicador;
    }

    return { ...indicador.dataValues };
  } catch (err) {
    throw err;
  }
};


/**
 * 
 * @deprecated
 */
const getIndicadoresFromTemaInteres = async (id) => {
  const indicadores = await Indicador.findAll({
    where: { idTema: id },
    attributes: ["id"],
    raw: true
  });
  return indicadores;
}

// TODO: use this function in controller
const definePrevNextIndicadores = async (idIndicador) => {
  throw new Error('Not implemented yet')
}


/**
 * 
 * @deprecated
 */
const getIndicadoresFilters = (matchedData) => {
  const { searchQuery } = matchedData;
  if (searchQuery) {
    const filter = {
      [Op.or]: [
        { nombre: { [Op.iLike]: `%${searchQuery}%` } },
        { definicion: { [Op.iLike]: `%${searchQuery}%` } },
        { codigo: { [Op.iLike]: `%${searchQuery}%` } },
        { observaciones: { [Op.iLike]: `%${searchQuery}%` } },
      ]
    };
    return filter;
  }
  return {};
};


/**@deprecated */
const advancedSearch = (matchedData) => {
  const { idObjetivo, owner, temas } = matchedData
  let filter = {};

  if (owner) {
    filter.owner = owner;
  }

  if (temas) {
    const temasArray = temas ? temas.split(',') : null;
    filter.idTema = temasArray;
  }


  return filter;
};


/**@deprecated */
const filterIndicadoresBy = (matchedData) => {
  const { anioUltimoValorDisponible, tendenciaActual } = matchedData;
  const filters = { activo: true };
  if (anioUltimoValorDisponible) {
    filters.anioUltimoValorDisponible = anioUltimoValorDisponible;
  }
  if (tendenciaActual) {
    filters.tendenciaActual = tendenciaActual;
  }

  return filters;
};



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
      await assignIndicadorToUsuario(created.id, indicador.owner)
      return created;
    })

    return result;
  } catch (err) {
    console.log(err)
    logger.error(err.stack)
    throw new Error(`Error al crear indicador: ${err.message}`);
  }
};


/**@deprecated */
const getFiltersForIndicadores = (queryParams) => {
  return [
    ...includeBasicModels(),
  ];
};

const assignIndicadorToUsuario = async (idIndicador, idUsuario) => {
  return createRelation(
    [idUsuario], [idIndicador], {
    updatedBy: idUsuario,
    createdBy: idUsuario,
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
  const { catalogos, temas, objetivos, ...values } = indicador;
  // TODO: validate indicadores destacados count, owner, 
  try {
    sequelize.transaction(async _t => {
      if (catalogos) {
        await updateOrCreateCatalogosFromIndicador(id, temasIds)
      }

      if (temas) {
        const temasIds = temas.map(tema => tema.id);
        await updateIndicadorTemas(id, temasIds);
      }

      if (objetivos) {
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


/**@deprecated */
const defineIncludesForAnIndicador = (pathway, queryParams) => {
  return [
    ...includeBasicModels(),
    ...includeHistorico(pathway),
    {
      model: Mapa,
      required: false,
      attributes: ['ubicacion', 'url']
    },
    {
      model: Formula,
      required: false,
      attributes: ['ecuacion', 'descripcion', 'isFormula'],
      include: [
        {
          model: Variable,
          required: false,
          attributes: [
            'nombre',
            'descripcion',
            'dato',
            'unidadMedida',
          ],
        }
      ]
    },
  ];
}


/**@deprecated */
const includeBasicModels = () => {
  return [
    {
      model: Tema,
      required: true,
      attributes: ['id', 'temaIndicador', 'descripcion', 'color', 'codigo', 'activo'],
      through: {
        model: IndicadorTema,
      }
    },
    {
      model: Objetivo,
      as: 'objetivos',
      required: true,
      attributes: ['id', 'titulo'],
      through: {
        model: IndicadorObjetivo,
        as: 'more',
        attributes: ['destacado']
      }
    },
    {
      model: Ods,
      as: 'ods',
      required: true,
      attributes: ['id', 'titulo', 'descripcion'],
    },
  ]
};


/**@deprecated */
const includeHistorico = (pathway) => {
  switch (pathway) {
    case FRONT_PATH:
      return [];
    case SITE_PATH:
      return [{
        model: Historico,
        required: false,
        attributes: ["anio", "valor", "fuente"],
        limit: 5,
        order: [["anio", "DESC"]],
      }];
    case FILE_PATH:
      return [{
        model: Historico,
        required: false,
        attributes: ["anio", "valor", "fuente"],
        order: [["anio", "DESC"]],
      }];
    default:
      throw new Error('Invalid pathway')
  };
};


/** @deprecated */
const filterByCatalogos = (catalogos) => {
  const inIds = [];
  const { ods, cobertura, medida } = catalogos || {};
  if (ods) {
    inIds.push(ods);
  }
  if (cobertura) {
    inIds.push(cobertura);
  }
  if (medida) {
    inIds.push(medida);
  }
  if (inIds.length === 0) {
    return [];
  }

  return [{
    model: CatalogoDetail,
    required: true,
    as: 'catalogosFilters',
    attributes: [],
    through: {
      attributes: [],
      where: { idCatalogoDetail: [...inIds] },
    }
  }];
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
  definePrevNextIndicadores,
  LIMIT_NUMBER_INDICADORES_PER_OBJETIVO,
  getIndicadores,
  getIndicador,
  findAllIndicadores,
  countIndicadores,
  includeAndFilterByObjetivos,
  includeAndFilterByTemas,
  includeAndFilterByODS,
  includeAndFilterByCobertura,
  includeAndFilterByUsuarios,
  includeResponsible,
  filterByUsuarios
};