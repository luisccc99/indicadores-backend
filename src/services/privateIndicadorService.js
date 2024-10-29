const { Op } = require('sequelize');
const { Indicador } = require('../models');
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

    const rows = await Indicador.findAll({
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
            includeAndFilterByObjetivos({ idObjetivo, objetivos, destacado }),
            includeAndFilterByTemas({ temas, idTema }),
            includeAndFilterByODS({ ods }),
            includeAndFilterByCobertura({ coberturas }),
            includeAndFilterByUsuarios({ idUsuario, usuarios }),
        ]
    });

    return rows;
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
    return {
        [Op.or]: [
            { nombre: { [Op.iLike]: `%${str}%` } },
            { unidadMedida: { [Op.iLike]: `%${str}%` } },
            { codigo: { [Op.iLike]: `%${str}%` } }
        ]
    }
}



module.exports = {
    getIndicadores,
    countIndicadores
}


