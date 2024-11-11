const UsuarioIndicadorService = require('../services/usuarioIndicadorService');
const ProtectedIndicadorService = require('../services/protectedIndicadorService');
const { getUsuariosByBulk } = require('../services/usuariosService');
const PrivateIndicadorService = require('../services/privateIndicadorService');

const createRelationUI = async (req, res, next) => {
    const { ids, idIndicador } = req.matchedData;
    const updatedBy = req.sub;
    const createdBy = req.sub;

    try {

        await UsuarioIndicadorService.createRelationUsersToIndicador(
            ids,
            idIndicador,
            {
                updatedBy,
                createdBy
            }
        );
        return res.sendStatus(201);

    } catch (err) {
        next(err)
    }
    return 1;
};

const createRelation = async (req, res, next) => {
    const { indicadores, usuarios } = req.matchedData;

    const updatedBy = req.sub;
    const createdBy = req.sub;

    try {
        await UsuarioIndicadorService.createRelation(usuarios, indicadores, {
            fechaDesde: null,
            fechaHasta: null,
            updatedBy,
            createdBy,
            expires: 'NO',
            activo: 'SI'
        });
        return res.sendStatus(201);
    } catch (err) {
        next(err);
    }
}

const changeOwner = async (req, res, next) => {
    const { idUsuario, idIndicador } = req.matchedData;
    const updatedBy = req.sub;
    try {
        await UsuarioIndicadorService.changeOwner(idUsuario, idIndicador, updatedBy);
        return res.sendStatus(204);
    } catch (err) {
        next(err);
    }
    return res.sendStatus(204);
};

const getRelationInformation = async (data) => {
    const ownersIds = [...new Set(data.map(indicador => indicador.owner))];
    const { usuarios } = await getUsuariosByBulk(ownersIds);
    return { usuarios };
};

const getIndicadoresRelations = async (req, res, next) => {
    const page = req.matchedData.page || 1;
    const perPage = req.matchedData.perPage || 10;
    try {
        const { data } = await UsuarioIndicadorService.getUsuariosIndicadores(page, perPage, req.matchedData);
        const { usuarios } = await getRelationInformation(data);
        const indicadorData = data.map(indicador => {
            const owner = usuarios.find(usuario => usuario.id === indicador.owner);
            return {
                ...indicador,
                owner: owner.nombres + ' ' + owner.apellidoPaterno
            }
        });
        // Paginate indicadorData
        const total = indicadorData.length;
        const paginatedData = indicadorData.slice((page - 1) * perPage, page * perPage);
        return res.status(200).json({ data: paginatedData, total });
    } catch (err) {
        next(err);
    }
};

const getRelationUsers = async (req, res, next) => {
    const { idIndicador, page, perPage } = req.matchedData;
    const attributes = ['nombre'];

    const { data, total } = await UsuarioIndicadorService.getRelationUsers(perPage, (page - 1) * perPage, idIndicador);

    const totalPages = Math.ceil(total / perPage);

    const { nombre, responsable } = await PrivateIndicadorService.getIndicadorById(idIndicador, attributes)
    const owner = responsable.length > 0 ? responsable[0].id : null;
    
    return res.status(200).json({ data, page, perPage, total, totalPages, nombre, owner });
};

const getUsuarios = async (req, res, next) => {
    const { idIndicador } = req.matchedData;
    try {
        const result = await UsuarioIndicadorService.getUsuariosThatDoesntHaveIndicador(idIndicador);
        return res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
};

const deleteRelation = async (req, res, next) => {
    const { ids } = req.query;
    try {
        await UsuarioIndicadorService.deleteRelation(ids);
        return res.sendStatus(204);
    } catch (err) {
        next(err);
    }
    return res.sendStatus(204);
};

const updateRelation = async (req, res, next) => {
    const { idRelacion, desde, hasta, expires } = req.matchedData;
    const updatedBy = req.sub;
    try {
        await UsuarioIndicadorService.updateRelation(idRelacion, {
            fechaDesde: desde ? desde : null,
            fechaHasta: hasta ? hasta : null,
            updatedBy,
            expires
        });
        return res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createRelationUI,
    getIndicadoresRelations,
    getRelationUsers,
    getUsuarios,
    deleteRelation,
    updateRelation,
    changeOwner,
    createRelation,
}