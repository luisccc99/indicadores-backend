const { Op } = require('sequelize');
const { Indicador, Tema, IndicadorTema, Objetivo, IndicadorObjetivo, Cobertura, Ods, sequelize } = require('../models');
const {
    includeAndFilterByObjetivos, includeAndFilterByODS,
    includeAndFilterByCobertura, includeAndFilterByUsuarios,
    includeAndFilterByTemas
} = require('./indicadorService');


/**
* @param {Object} args
* @param {number} args.page
* @param {number} args.perPage
* @param {string} args.searchQuery 
* @param {Object} args.filters
* @param {boolean} args.filters.destacado
* @param {number} args.filters.idObjetivo
* @param {number[]} args.filters.objetivos
* @param {number} args.filters.idTema
* @param {number[]} args.filters.temas
* @param {number} args.filters.idUsuario
* @param {number[]} args.filters.usuarios
* @param {number[]} args.filters.coberturas
* @param {number[]} args.filters.ods
* @param {boolean} args.filters.activo
* @returns {Promise<Array>} list of indicadores 
*/
async function getIndicadores({ page = 1, perPage = 25, offset = null, searchQuery, ...filters }) {
    const {
        idObjetivo = null, objetivos = [], destacado, idTema = null,
        temas = [], usuarios = [], idUsuario = null, coberturas = [],
        ods = [], activo = null, owner = null,
    } = filters || {};

    return Indicador.findAll({
        limit: perPage,
        offset: offset !== null ? offset : (page - 1) * perPage,
        attributes: [
            'id', 'nombre', 'activo', 'tendenciaActual', 'ultimoValorDisponible',
            'adornment', 'unidadMedida', 'anioUltimoValorDisponible', 'updatedAt', 'createdAt',
            'createdBy', 'updatedBy', 'owner', 'observaciones', 'periodicidad'
        ],
        where: {
            ...(activo !== null && { activo }),
            ...(searchQuery && filterBySearchQuery(searchQuery)),
            ...(owner !== null && { owner })
        },
        order: [
            ['updatedAt', 'desc'],
            ['id', 'asc']
        ],
        include: [
            includeAndFilterByObjetivos(
                { idObjetivo, objetivos, destacado }, ['id', 'titulo', 'color', 'alias']),
            includeAndFilterByTemas(
                { temas, idTema }, ['id', 'temaIndicador', 'color']
            ),
            includeAndFilterByODS({ ods }, ['id', 'posicion', 'titulo']),
            includeAndFilterByCobertura({ coberturas }, ['id', 'tipo', 'urlImagen']),
            includeAndFilterByUsuarios({ idUsuario, usuarios }, ['id', 'nombres', 'correo', 'urlImagen']),
        ]
    });

}


async function countIndicadores({ searchQuery = '', ...filters }) {
    const {
        idObjetivo = null, objetivos = [], destacado = null, idTema = null,
        temas = [], usuarios = [], idUsuario = null, coberturas = [], ods = [],
        activo = null, owner = null
    } = filters || {};

    const count = await Indicador.count({
        where: {
            ...(activo !== null && { activo }),
            ...(searchQuery && filterBySearchQuery(searchQuery)),
            ...(owner !== null && { owner })
        },
        include: [
            includeAndFilterByObjetivos({ idObjetivo, objetivos, destacado }),
            includeAndFilterByTemas({ temas, idTema }),
            includeAndFilterByODS({ ods }),
            includeAndFilterByCobertura({ coberturas }),
            includeAndFilterByUsuarios({ idUsuario, usuarios }),
        ]
    })
    return count;
}


const filterBySearchQuery = (str) => {
    const filters = [
        { nombre: { [Op.iLike]: `%${str}%` } },
        { unidadMedida: { [Op.iLike]: `%${str}%` } },
    ]

    if (!isNaN(parseInt(str))) {
        const searchById = {
            id: {
                [Op.eq]: parseInt(str)
            }
        }
        filters.push(searchById)
    }

    return { [Op.or]: filters }
}


const getIndicadorById = async (idIndicador) => {
    const indicador = await Indicador.findByPk(idIndicador, {
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
            attributes: ['id', 'titulo', [sequelize.literal('"objetivos->more"."destacado"'), 'destacado'], 'color'],
            through: {
                model: IndicadorObjetivo,
                as: 'more',
                attributes: []
            }
        }, {
            model: Cobertura,
            attributes: ['tipo', 'descripcion', 'urlImagen']
        }, {
            model: Ods,
            attributes: ['posicion', 'titulo', 'descripcion', 'urlImagen']
        }]
    })
    return indicador.get({ plain: true });
}


module.exports = {
    getIndicadores,
    countIndicadores,
    getIndicadorById
}


