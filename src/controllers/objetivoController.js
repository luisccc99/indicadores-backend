const { QueryTypes } = require('sequelize');
const { Objetivo, Sequelize, Indicador, Tema, IndicadorObjetivo, sequelize } = require('../models');
const IndicadorService = require('../services/indicadorService');
const PublicIndicadorService = require('../services/publicIndicadorService');

const countIndicadoresByObjetivo = async (req, res, next) => {
    try {
        const result = await IndicadorObjetivo.findAll({
            attributes: [[Sequelize.fn('COUNT', Sequelize.col('idIndicador')), 'indicadoresCount']],
            include: [{
                model: Objetivo,
                attributes: ['id', 'titulo', 'descripcion', 'urlImagen', 'color', 'summary'],
            }],
            group: ['idObjetivo', 'objetivo.id'],
            order: [['idObjetivo']],
        })

        const destacados = await PublicIndicadorService.getIndicadores({
            destacado: true,
            offset: 0,
        });

        return res.status(200).json({
            data: result,
            destacados
        });
    } catch (err) {
        next(err);
    }
};

const editObjetivo = async (req, res, next) => {
    const { idTema, ...fields } = req.matchedData;
    const image = getImagePathLocation(req);

    try {
        const updateObjetivo = 1;

        return res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};

const getObjetivo = async (req, res, next) => {
    const { idObjetivo } = req.matchedData;
    try {
        const objetivo = await Objetivo.findByPk(idObjetivo);
        if (objetivo === null) {
            return res.sendStatus(404);
        }
        return res.status(200).json({ data: objetivo });
    } catch (err) {
        next(err);
    }
};

const getObjetivos = async (req, res, next) => {
    try {
        const objetivos = await Objetivo.findAll({
            raw: true,
            attributes: [
                'id',
                'titulo',
                [sequelize.fn('COUNT', sequelize.col('"indicadores"."id"')), 'indicadoresCount'],
                'summary',
                'urlImagen',
                'descripcion',
                'color',
                'alias',
            ],
            include: [{
                model: Indicador,
                attributes: [],
                through: {
                    model: IndicadorObjetivo,
                    attributes: []
                }
            }],

            group: 'Objetivo.id',
            order: [['id', 'ASC']]
        });

        return res.status(200).json({ data: objetivos });
    } catch (err) {
        next(err);
    }
}

const getTemasInObjetivo = async (req, res, next) => {
    const { idObjetivo, page, perPage } = req.matchedData;
    const temas = await sequelize.query(
        'SELECT m."id", m."temaIndicador" FROM "Temas" m ' +
        'INNER JOIN "Indicadores" i on i."idTema" = m."id" ' +
        'INNER JOIN "IndicadorObjetivos" io on io."idIndicador" = i."id" ' +
        'WHERE io."idObjetivo" = :idObjetivo ' +
        'GROUP BY m."id", m."temaIndicador"', {
        replacements: {
            idObjetivo
        },
        type: QueryTypes.SELECT
    })

    return res.status(200).json({ data: temas });
}

module.exports = {
    countIndicadoresByObjetivo,
    editObjetivo,
    getObjetivo,
    getTemasInObjetivo,
    getObjetivos
}