const { Op } = require('sequelize');
const { Indicador, Tema, IndicadorTema, Objetivo, IndicadorObjetivo, Cobertura, Ods, sequelize } = require('../models');
const {
    includeAndFilterByObjetivos, includeAndFilterByODS,
    includeAndFilterByCobertura, includeAndFilterByUsuarios,
    includeAndFilterByTemas,
    includeResponsible,
    filterByUsuarios
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
    try {
        const row = await Indicador.findAll({
            limit: perPage,
            offset: offset !== null ? offset : (page - 1) * perPage,
            attributes: [
                'id', 'nombre', 'activo', 'tendenciaActual', 'ultimoValorDisponible',
                'adornment', 'unidadMedida', 'anioUltimoValorDisponible', 'updatedAt', 'createdAt',
                'createdBy', 'updatedBy', 'observaciones', 'periodicidad', 'elif'
            ],
            where: {
                ...(activo !== null && { activo }),
                ...(searchQuery && filterBySearchQuery(searchQuery)),
            },
            order: [
                ['id', 'asc'],
                ['updatedAt', 'desc'],
            ],
            include: [
                includeAndFilterByObjetivos({ idObjetivo, objetivos, destacado }, ['id', 'titulo', 'color', 'alias']),
                includeAndFilterByTemas({ temas, idTema }, ['id', 'temaIndicador', 'color']),
                includeAndFilterByODS({ ods }, ['id', 'posicion', 'titulo']),
                includeAndFilterByCobertura({ coberturas }, ['id', 'tipo', 'urlImagen']),
                includeResponsible(['id', 'nombres', 'correo', 'urlImagen']),
                filterByUsuarios({ usuarios, owner, idUsuario }),
            ],
        });
        return row;
    } catch (err) {
        console.log(err)
        throw new Error('Hubo un error al consultar indicadores')
    }

}


async function countIndicadores({ searchQuery = '', ...filters }) {
    const {
        idObjetivo = null, objetivos = [], destacado = null, idTema = null,
        temas = [], usuarios = [], idUsuario = null, coberturas = [], ods = [],
        activo = null, owner = null
    } = filters || {};
    try {

        const count = await Indicador.count({
            where: {
                ...(activo !== null && { activo }),
                ...(searchQuery && filterBySearchQuery(searchQuery)),
            },
            include: [
                includeAndFilterByObjetivos({ idObjetivo, objetivos, destacado }),
                includeAndFilterByTemas({ temas, idTema }),
                includeAndFilterByODS({ ods }),
                includeAndFilterByCobertura({ coberturas }),
                filterByUsuarios({ usuarios, owner, idUsuario })
            ]
        })
        return count;
    } catch (err) {
        console.log(err)
        throw new Error('Hubo un error al consultar número de indicadores')
    }
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


/**
 * 
 * @param {number} idIndicador 
 * @param {string[]} attributes 
 * @returns 
 */
const getIndicadorById = async (idIndicador, attributes) => {
    const indicador = await Indicador.findByPk(idIndicador, {
        ...(attributes !== undefined && { attributes }),
        include: [
            includeAndFilterByTemas(null, ['id', 'temaIndicador', 'color', 'codigo']),
            includeAndFilterByObjetivos(null, ['id', 'titulo', [sequelize.literal('"objetivos->more"."destacado"'), 'destacado'], 'color']),
            includeAndFilterByCobertura(null, ['id', 'tipo', 'descripcion', 'urlImagen']),
            includeAndFilterByODS(null, ['id', 'posicion', 'titulo', 'descripcion', 'urlImagen']),
            includeResponsible(['id', 'nombres', 'correo']),
        ]
    })
    return indicador?.get({ plain: true });
}


module.exports = {
    getIndicadores,
    countIndicadores,
    getIndicadorById
}


