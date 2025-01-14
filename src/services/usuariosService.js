const logger = require('../config/logger');
const { Usuario, Rol, Indicador, Sequelize, sequelize, UsuarioIndicador, Tema } = require('../models');

const { Op } = Sequelize;

const addUsuario = async (usuario) => {
    try {
        const { nombres,
            correo,
            apellidoPaterno,
            apellidoMaterno,
            activo
        } = await Usuario.create(usuario);
        return {
            nombres,
            correo,
            apellidoPaterno,
            apellidoMaterno,
            activo
        };
    } catch (err) {
        throw new Error(`Error al crear usuario ${err.message}`);
    }
};

const getUsuarioById = async (id) => {
    try {
        const usuario = await Usuario.findOne({
            where: { id },
            attributes: [
                'id',
                'correo',
                'nombres',
                'apellidoPaterno',
                'apellidoMaterno',
                'descripcion',
                'activo',
                'urlImagen',
                'requestedPasswordChange',
                [sequelize.literal('"rol"."id"'), "idRol"],
                [sequelize.literal('"rol"."rol"'), "roles"],
                [sequelize.literal('"rol"."activo"'), "isRolActivo"],
            ],
            include: [{
                model: Rol,
                attributes: [],
            }],
        });
        return usuario;
    } catch (err) {
        throw new Error(`Error al buscar usuario por ID: ${err.message}`);
    }
};

const getUsuarioByCorreo = async (correo) => {
    try {
        const usuario = await Usuario.findOne({ where: { correo } });
        return usuario;
    } catch (err) {
        throw (new Error(`Error al buscar usuario por correo: ${err.message}`));
    }
};

const isCorreoAlreadyInUse = async (correo) => {
    try {
        const existingCorreo = await Usuario.findOne({
            attributes: ['correo'],
            where: { correo }
        });
        return existingCorreo !== null;
    } catch (err) {
        throw new Error(`Error al buscar si correo ha sido utilizado: ${err.message}`);
    }
};

const addSearchQueryIfPresent = (searchQuery) => {

    if (searchQuery && searchQuery !== '') {
        return {
            [Op.or]: [
                { nombres: { [Op.iLike]: `%${searchQuery}%` } },
                { apellidoPaterno: { [Op.iLike]: `%${searchQuery}%` } },
                { apellidoMaterno: { [Op.iLike]: `%${searchQuery}%` } },
                { correo: { [Op.iLike]: `%${searchQuery}%` } },
            ]
        };
    }
}

const addFilterIfPresent = (filter) => {
    if (filter && filter !== '') {
        return {
            activo: filter
        };
    }
}


const getUsuarios = async (limit, offset, searchQuery, activo) => {

    try {

        const result = await Usuario.scope('withoutPassword').findAndCountAll({
            limit,
            offset,
            where: {
                ...addSearchQueryIfPresent(searchQuery),
                ...addFilterIfPresent(activo)
            },
            order: [['updatedAt', 'asc']],
            include: [
                {
                    model: Rol,
                    required: true,
                    attributes: ['rol', 'id']
                }
            ],

        });

        const usuarios = result.rows;
        const total = result.count;
        return { usuarios, total };
    } catch (err) {
        throw new Error(`Error al obtener lista de usuarios: ${err.message}`);
    }
};


const getUsuariosByBulk = async (ids) => {
    try {
        const result = await Usuario.scope('withoutPassword').findAndCountAll({
            where: {
                id: {
                    [Op.in]: ids
                }
            }

        });
        const usuarios = result.rows;
        return { usuarios };
    } catch (err) {
        throw new Error(`Error al obtener lista de usuarios: ${err.message}`);
    }
};


const countInactiveUsers = async () => {
    try {
        const inactiveCount = await Usuario.count({ where: { activo: false } });
        return inactiveCount;
    } catch (err) {
        throw new Error(`Error al contar usuarios inactivos ${err.message}`);
    }
}


const updateUsuario = async (id, fieldsWithImage) => {
    try {
        const affectedRows = await Usuario.update(
            { ...fieldsWithImage },
            { where: { id } });
        return affectedRows > 0;
    } catch (err) {
        logger.error(err.stack)
        throw new Error(`Error al actualizar usuario: ${err.message}`);
    }
};

const getRol = async (id) => {
    try {
        const { rolValue: rol } = await Usuario.findOne({
            where: { id },
            include: [
                {
                    model: Rol,
                    required: true,
                    attributes: []
                }
            ],
            attributes: [[Sequelize.literal('"rol"."rol"'), 'rolValue']],
            raw: true
        });
        return rol;
    } catch (err) {
        throw new Error(`Error al obtener rol de usuario: ${err.message}`);
    }
};

// Retrieves a list of indicadores based on user 
const getIndicadoresFromUser = async (id) => {
    try {
        const result = await Usuario.findOne({
            attributes: [],
            where: {
                id,
                activo: true
            },
            include: {
                model: Indicador,
                through: {
                    as: 'usuarioIndicador',
                    attributes: [],
                    where: {
                        activo: 'SI',
                    }
                }
            }
        });
        return {
            indicadores: result.dataValues.indicadores,
            total: result.dataValues.indicadores.length,
        }
    } catch (err) {
        throw new Error(`Error al obtener indicadores de un usuario: ${err.message}`);
    }
};

const toggleStatus = async (id) => {
    try {
        const usuario = await Usuario.findOne({ where: { id }, attributes: ['activo'] });
        const nuevoEstado = usuario.activo ? false : true;

        const updateUsuario = await Usuario.update(
            { activo: nuevoEstado },
            { where: { id: id } });
        return updateUsuario > 0;
    } catch (err) {
        throw new Error('Error al actualizar estado de usuario: ' + err.message);
    }
};

const updateUserPassword = async (id, password) => {
    try {
        const affectedRows = await Usuario.update(
            { clave: password },
            { where: { id: id } });
        return affectedRows > 0;
    } catch (err) {
        throw new Error(`Error al actualizar contraseña: ${err.message}`);
    }
};

const toggleUsuarioRequestPasswordChange = async (id) => {
    try {
        const { requestedPasswordChange: currentStatus } = await Usuario.findOne({
            attributes: ['requestedPasswordChange'],
            where: { id }
        });
        const affectedRows = await Usuario.update(
            { requestedPasswordChange: !currentStatus },
            { where: { id } });
        return affectedRows > 0;
    } catch (err) {
        throw new Error(`Error al solicitar actualización de clave: ${err.message}`);
    }
};

const isUserActive = async (id) => {
    try {
        const status = await Usuario.findOne({
            attributes: ['activo'],
            where: { id },
            raw: true
        });
        return status?.activo;
    } catch (err) {
        throw new Error(`Error al obtener estado de usuario ${err.message}`);
    }
};

const getUserStatsInfo = async (id) => {
    try {
        const indicadorCount = await Indicador.count({});
        const usuarioIndicadorCount = await UsuarioIndicador.count({
            where: {
                idUsuario: id,
            }
        });
        const temasCount = await Tema.count({});
        const temasInactivosCount = await Tema.count({
            where: {
                activo: false
            }
        });

        const usuariosCount = await Usuario.count({});
        const usuariosInactivosCount = await Usuario.count({
            where: {
                activo: false
            }
        });

        return {
            indicadores: (indicadorCount - usuarioIndicadorCount),
            indicadoresAsignados: (usuarioIndicadorCount),
            temas: (temasCount - temasInactivosCount),
            temasInactivos: temasInactivosCount,
            usuarios: (usuariosCount - usuariosInactivosCount),
            usuariosInactivos: usuariosInactivosCount
        }

    }
    catch (err) {
        throw new Error(`Error al obtener estadísticas de usuario ${err.message}`);
    }
}

const getUsersFromIndicador = async (id) => {
    try {
        const result = await UsuarioIndicador.findAll({
            where: {
                idIndicador: id,
            },
            include: {
                model: Usuario,
                attributes: []
            },
            attributes: [
                'idUsuario',
                'activo',
                [sequelize.literal('"usuario"."nombres"'), "nombres"],
                [sequelize.literal('"usuario"."apellidoPaterno"'), "apellido"],
                [sequelize.literal('"usuario"."activo"'), "activo"],
                [sequelize.literal('"usuario"."urlImagen"'), "urlImagen"],
            ]
        });
        return result;
    } catch (err) {
        throw new Error(`Error al obtener usuarios de indicador ${err.message}`);
    }
}

module.exports = {
    addUsuario,
    getUsuarioById,
    getUsuarioByCorreo,
    getUsuarios,
    isCorreoAlreadyInUse,
    updateUsuario,
    updateUserStatus: toggleStatus,
    getRol,
    getIndicadoresFromUser,
    countInactiveUsers,
    updateUserPassword,
    toggleUsuarioRequestPasswordChange,
    isUserActive,
    getUserStatsInfo,
    getUsersFromIndicador,
    getUsuariosByBulk
}