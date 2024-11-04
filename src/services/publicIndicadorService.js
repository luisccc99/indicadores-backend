const {
    Indicador,
    Tema,
    Objetivo,
    IndicadorObjetivo,
    IndicadorTema,
    Historico,
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
    const indicador = await Indicador.findOne({
        where: { id },
        include: [
            {
                model: Tema,
                required: true,
                attributes: ['id', 'temaIndicador', 'color', 'codigo'],
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
                model: Historico,
                required: false,
                attributes: ["anio", "valor", "fuente"],
                limit: 5,
                order: [["anio", "DESC"]],
            }
        ],
        attributes,
    });

    const { prevIndicador, nextIndicador } = await definePrevNextIndicadores(id);

    indicador['prev'] = prevIndicador;
    indicador['next'] = nextIndicador;

    return { ...indicador.dataValues };
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
                ['id', 'posicion', 'urlImagen']
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

module.exports = {
    getIndicadorById,
    getIndicadores,
    countIndicadores
}