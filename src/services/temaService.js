const { Tema, Sequelize, Indicador, IndicadorTema } = require('../models');
const { Op } = Sequelize;

const getTemas = async () => {
    try {
        const temas = await Tema.findAll({
            where: {
                activo: true
            },
            attributes: [
                'id',
                'temaIndicador',
                'codigo',
                'urlImagen',
                'color',
                'descripcion',
                [Sequelize.fn('COUNT', Sequelize.col('indicadores.id')), 'indicadoresCount']
            ],
            include: [{
                model: Indicador,
                through: {
                    model: IndicadorTema,
                    attributes: []
                },
                attributes: []
            }],
            group: ['Tema.id'],
            order: [['id']],
            raw: true
        });
        return temas;
    } catch (err) {
        throw new Error(`Error al obtener temas ${err.message}`);
    }
};

const addTema = async (tema) => {
    try {
        const created = await Tema.create(tema);
        return created;
    } catch (err) {
        throw new Error(`Error al crear Tema ${err.message}`);
    }
};

const updateTema = async (id, values) => {
    try {
        const affectedRows = await Tema.update({ ...values },
            { where: { id } }
        );
        return affectedRows > 0;
    } catch (err) {
        throw new Error(`Error al actualizar Tema ${err.message}`);
    }
};

const isTemaIndicadorAlreadyInUse = async (temaIndicador) => {
    try {
        const existingTema = await Tema.findOne({
            attributes: ['temaIndicador'],
            where: { temaIndicador }
        });
        return existingTema != null;
    } catch (err) {
        throw new Error(`Error al buscar tema indicador ${err.message}`);
    }
};

const getAllTemas = async (page, perPage, matchedData) => {
    try {
        const result = await Tema.findAndCountAll({
            where: getAllTemasFilters(matchedData),
            order: getTemasSorting(matchedData),
            limit: perPage,
            offset: (page - 1) * perPage,
            attributes: [
                'id',
                'codigo',
                'temaIndicador',
                'createdAt',
                'updatedAt',
                'urlImagen',
                'color',
                'observaciones',
                'activo',
                'descripcion'
            ],
        });
        return { temas: result.rows, total: result.count };
    } catch (err) {
        throw new Error(`Error al obtener todos los temas ${err.message}`);
    }
};

const countTemas = async () => {
    try {
        const inactiveCount = await Tema.count({ where: { activo: false } });
        return inactiveCount;
    } catch (err) {
        throw new Error(`Error al contar temas ${err.message}`);
    }
}


const getTemasSorting = ({ sortBy, order }) => {
    const arrangement = [];
    arrangement.push([sortBy || 'id', order || 'ASC']);
    return arrangement;
};

const getAllTemasFilters = (matchedData) => {
    const { searchQuery } = matchedData;
    if (searchQuery) {
        const filter = {
            [Op.or]: [
                { temaIndicador: { [Op.iLike]: `%${searchQuery}%` } },
                { codigo: { [Op.iLike]: `%${searchQuery}%` } },
                { observaciones: { [Op.iLike]: `%${searchQuery}%` } },
            ]
        }
        return filter;
    }
    return {};
};

const updateTemaStatus = async (id) => {
    try {
        const tema = await Tema.findOne({
            where: { id },
            attributes: ['activo', 'id'],
        });

        const nuevoEstado = tema.activo === true ? false : true;

        const updatedTema = await tema.update(
            { activo: nuevoEstado },
            { where: { id } }
        );

        return updatedTema;

    } catch (err) {
        throw new Error(`Error al buscar el módulo ${err.message}`);
    }
}

module.exports = {
    getTemas,
    countTemas,
    addTema,
    isTemaIndicadorAlreadyInUse,
    updateTema,
    getAllTemas,
    updateTemaStatus
}