const logger = require('../config/logger');
const {
    Indicador,
    Tema,
    Objetivo,
    IndicadorObjetivo,
    IndicadorTema,
    Historico,
    Ods,
    UsuarioIndicador,
    Usuario,
    Formula,
    Cobertura,
    Variable,
    sequelize,
    Sequelize
} = require('../models');
const { includeAndFilterByObjetivos, includeAndFilterByTemas, includeAndFilterByCobertura, includeAndFilterByODS } = require('./indicadorService');
const { Op } = Sequelize;


/**
 * 
 * @param {number} id 
 * @returns indicador object
 */
async function getIndicadorById(id) {
    try {
        const indicador = await Indicador.findOne({
            where: { id, activo: true },
            attributes: [
                "id", "nombre", "ultimoValorDisponible",
                "adornment", "definicion", "anioUltimoValorDisponible",
                "tendenciaActual", "fuente", "updatedAt",
                "periodicidad", "archive", "unidadMedida",
            ],
            include: [{
                model: Tema,
                required: false,
                attributes: ['id', 'temaIndicador', 'color', 'codigo'],
                through: {
                    model: IndicadorTema,
                    attributes: []
                }
            }, {
                model: Objetivo,
                as: 'objetivos',
                required: false,
                attributes: ['id', 'titulo', [sequelize.literal('"objetivos->more"."destacado"'), 'destacado']],
                through: {
                    model: IndicadorObjetivo,
                    as: 'more',
                    attributes: []
                }
            }, {
                model: Formula,
                required: false,
                include: {
                    model: Variable
                }
            }, {
                model: Historico,
                required: false,
                attributes: ["anio", "valor", "fuente"],
                limit: 5,
                order: [["anio", "DESC"]],
            }, {
                model: Usuario,
                required: false,
                attributes: ['correo', 'nombres', 'apellidoPaterno', 'apellidoMaterno', 'descripcion', 'urlImagen'],
                through: {
                    model: UsuarioIndicador,
                    // TODO ADD isOwner filter
                    attributes: [],
                },
            }, {
                model: Cobertura,
                attributes: ['tipo', 'descripcion', 'urlImagen']
            }, {
                model: Ods,
                attributes: ['posicion', 'titulo', 'descripcion', 'urlImagen']
            }],
        });
        return indicador;
    } catch (err) {
        logger.error(err)
        throw new Error('Hubo un error al consultar este indicador')
    }
}

/**
* @param {Object} args
* @param {number} args.page
* @param {number} args.perPage
* @param {string} args.searchQuery 
* @param {Object} args.filters
* @param {number} args.filters.idObjetivo
* @param {boolean} args.filters.destacado
* @param {number[]} args.filters.temas
* @param {number[]} args.filters.coberturas
* @param {number[]} args.filters.ods
* @returns {Promise<Array>} list of indicadores 
*/
async function getIndicadores({ page = 1, perPage = 25, offset = null, searchQuery = '', ...filters }) {
    const { idObjetivo, destacado, temas = [], idTema = null, coberturas = [], ods = [] } = filters || {};

    const rows = await Indicador.findAll({
        limit: perPage,
        offset: offset !== null ? offset : (page - 1) * perPage,
        attributes:
            ['id', 'nombre', 'tendenciaActual', 'ultimoValorDisponible', 'adornment', 'unidadMedida', 'anioUltimoValorDisponible', 'updatedAt'],
        where: {
            activo: true,
            ...(searchQuery && filterBySearchQuery(searchQuery))
        },
        include: [
            includeAndFilterByObjetivos(
                { idObjetivo, destacado },
                ['id', 'titulo', [sequelize.literal('"objetivos->more"."destacado"'), 'destacado']]
            ),

            includeAndFilterByTemas(
                { temas, idTema },
                ['id', 'temaIndicador', 'codigo', 'urlImagen']
            ),
            includeAndFilterByCobertura(
                { coberturas },
                ['id', 'tipo', 'urlImagen']
            ),
            includeAndFilterByODS(
                { ods },
                ['id', 'posicion', 'urlImagen', 'titulo']
            )
        ],
        order: [
            ['updatedAt', 'desc'],
            ['id', 'asc']
        ],

    });


    return rows;
}

/**
 * @param {string} searchQuery 
 * @param {Object} filters
 * @param {number} filters.idObjetivo
 * @param {boolean} filters.destacado
 * @param {number[]} filters.temas
 * @returns number of indicadores with given criteria
 */
async function countIndicadores({ searchQuery = '', ...filters }) {
    const { idObjetivo, destacado, temas, ods, idTema } = filters;

    const count = await Indicador.count({
        where: {
            activo: true,
            ...(searchQuery && filterBySearchQuery(searchQuery))
        },
        include: [
            includeAndFilterByObjetivos({ idObjetivo, destacado }),
            includeAndFilterByTemas({ temas, idTema }),
            includeAndFilterByODS({ ods })
        ]
    })
    return count;
}


const filterBySearchQuery = (str) => {
    return {
        [Op.or]: [
            { nombre: { [Op.iLike]: `%${str}%` } },
            { unidadMedida: { [Op.iLike]: `%${str}%` } }
        ]
    }
}


const getIndicadoresRelacionadosTo = async (idIndicador) => {
    const indicador = await Indicador.findByPk(idIndicador, {
        attributes: [],
        include: [includeAndFilterByObjetivos(null, ['id'])],
    });

    if (!indicador) {
        return []
    }

    const idObjetivo = indicador.objetivos[0].id;

    const prev = await getIndicadorRelatedToObjetivo({ idIndicador, idObjetivo, position: 'prev' })
    const next = await getIndicadorRelatedToObjetivo({ idIndicador, idObjetivo, position: 'next' })
    return [...prev, ...next].sort((a, b) => a.id - b.id);
}


const getIndicadorRelatedToObjetivo = async ({ idIndicador, idObjetivo, position = null }) => {
    const { op, order } = getOpAndOrderByPosition(position)

    return Indicador.findAll({
        attributes: ['id', 'nombre'],
        limit: 3,
        order,
        where: {
            activo: true,
            id: {
                [op]: idIndicador
            }
        },
        include: [
            includeAndFilterByObjetivos({ idObjetivo }, null)
        ],
        raw: true,
        nest: true
    });
}


const getOpAndOrderByPosition = (position) => {
    let op = null;
    let order = [];

    if (position === 'prev') {
        op = Op.lt;
        order = [['id', 'DESC']]
    } else if (position === 'next') {
        op = Op.gt;
        order = [['id', 'ASC']]
    }

    return { op, order }
}


module.exports = {
    getIndicadorById,
    getIndicadores,
    countIndicadores,
    getIndicadoresRelacionadosTo
}