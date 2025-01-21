/* eslint-disable no-restricted-syntax */
const { where } = require('sequelize');
const logger = require('../config/logger');
const { UsuarioIndicador, Usuario, Indicador, sequelize, Sequelize } = require('../models');
const { getInformation } = require('./generalServices');
const { splitNameKeepFirstOne } = require('../utils/stringFormat');
const { differenceInMonths } = require('date-fns');
const sender = require('../middlewares/mailSender');
const { Op } = Sequelize;

const isUsuarioAssignedToIndicador = async (idUsuario, idIndicador) => {
  try {
    const res = await UsuarioIndicador.findOne({
      where: {
        idUsuario,
        idIndicador,
        activo: 'SI',
      },
      attributes: [
        [Sequelize.fn('COUNT', 'id'), 'count']
      ],
      include: [
        {
          model: Usuario,
          where: {
            activo: true,
          },
          attributes: []
        },
        {
          model: Indicador,
          where: {
            activo: true,
          },
          attributes: []
        }
      ],
      raw: true
    });
    return res.count > 0;
  } catch (err) {
    throw new Error(err.message);
  }
};

const createRelation = async (usuarios, indicadores, relationOptions) => {
  const relations = [];
  for (const u of usuarios) {
    for (const i of indicadores) {
      relations.push({
        idUsuario: u,
        idIndicador: i,
        ...relationOptions
      })
    }
  }
  try {
    await UsuarioIndicador.bulkCreate(
      relations,
      {
        ignoreDuplicates: true,
        validate: true,
      });
    return;
  } catch (err) {
    throw new Error(`Error al otorgar permisos ${err.message}`);
  }
};

const createRelationUsersToIndicador = async (usuarios, idIndicador, options) => {
  try {
    const relations = usuarios.map(u => ({
      idUsuario: u,
      idIndicador,
      ...options
    }));
    await UsuarioIndicador.bulkCreate(
      relations,
      {
        ignoreDuplicates: true,
        validate: true,
      });
    return;
  } catch (err) {
    throw new Error(`Error al otorgar permisos ${err.message}`);
  }
};


const changeOwner = async (idUsuario, idIndicador, updatedBy) => {
  try {
    const currentOwner = await UsuarioIndicador.findOne({
      where: {
        idIndicador,
        isOwner: true
      },
      raw: true
    });

    if (idUsuario === currentOwner.idUsuario) {
      return;
    }

    sequelize.transaction(async _t => {
      await UsuarioIndicador.update({
        isOwner: false
      }, {
        where: { id: currentOwner.id },
      });

      const alreadyAssigned = await UsuarioIndicador.findOne({ where: { idUsuario, idIndicador }, raw: true });
      if (alreadyAssigned) {
        await UsuarioIndicador.update({ isOwner: true, updatedBy }, { where: { id: alreadyAssigned.id } });
        return;
      }

      await UsuarioIndicador.create({
        idIndicador,
        idUsuario,
        isOwner: true,
        updatedBy,
        createdBy: updatedBy,
        expires: 'NO',
      });
      return;
    })
  } catch (err) {
    logger.error(err);
    throw new Error('Hubo un error al cambiar responsable de este indicador')
  }
}

/** Gets a list of indicadores, its owner and how many users are responsible for them */
const getUsuariosIndicadores = async (page, perPage, matchedData) => {

  try {
    const result = await UsuarioIndicador.findAndCountAll({
      include: [
        {
          model: Indicador,
          required: true,
          where: getAllRelationsFilters(matchedData),
        },
      ],
      attributes: [
        'indicador.updatedAt',
        'indicador.id',
        'indicador.nombre',
      ],
      group: [
        'indicador.id',
        'indicador.nombre',
        'indicador.updatedAt',
      ],
    });

    return {
      data: result.count,
    }
  } catch (err) {
    throw new Error(`Error al obtener los usuariosIndicadores: ${err.message}`);
  }
};

/** Returns a list of how many users and the information about the relation between usuarios - indicadores. Also, it returns the name of the selected indicador */
const getRelationUsers = async (limit, offset, idIndicador) => {
  try {
    const result = await UsuarioIndicador.findAndCountAll({
      limit,
      offset,
      where: {
        idIndicador,
      },
      include: [
        {
          model: Usuario,
          required: true,
          attributes: ['nombres', 'apellidoPaterno', 'apellidoMaterno'],
          where: {
            activo: true,
          }
        },
        {
          model: Indicador,
          required: true,
          attributes: [],
        }
      ],
      attributes: [
        'id', 'idUsuario', 'createdBy', 'createdAt',
        [sequelize.literal('"indicador"."nombre"'), "indicador"],
      ],
    });
    return {
      data: result.rows,
      total: result.count,
    };

  } catch (err) {
    throw new Error(`Error al obtener los usuariosIndicadores: ${err.message}`);
  }
};

const getUsuariosThatDontHaveIndicador = async (idIndicador) => {
  try {
    const idUsuarios = await sequelize.query(`SELECT "idUsuario" FROM "UsuarioIndicadores" WHERE "idIndicador" = ${idIndicador};
    `, { raw: true, type: sequelize.QueryTypes.SELECT });
    const ids = idUsuarios.map(u => u.idUsuario);

    const result = await Usuario.findAll({
      where: {
        id:
        {
          [Op.notIn]: ids
        },
        activo: true
      },
      attributes: ['id', 'nombres', 'apellidoPaterno', 'apellidoMaterno', 'urlImagen'],
    });
    return result

  } catch (err) {
    throw new Error(`Error al obtener los usuariosIndicadores: ${err.message}`);
  }
};

const getAllRelationsFilters = (matchedData) => {
  const { searchQuery } = matchedData;
  if (searchQuery) {
    const filter = {
      [Op.or]: [
        { nombre: { [Op.iLike]: `%${searchQuery}%` } },
      ]
    }
    return filter;
  }
  return {};
};

const createRelationWithModules = async (idTema) => {
  try {
    const indicadoresID = await Indicador.findAll({
      where: {
        idTema
      },
      attributes: ['id']
    });
    return indicadoresID;
  } catch (err) {
    throw new Error(`Error al actualizar la relacion: ${err.message}`);
  }
};

const deleteRelation = async (ids) => {
  try {
    await UsuarioIndicador.destroy({
      where: {
        id: ids
      }
    });
    return;
  } catch (err) {
    throw new Error(`Error al eliminar la relacion: ${err.message}`);
  }
};

const updateRelation = async (id, options) => {
  try {
    await UsuarioIndicador.update(options, {
      where: {
        id
      }
    });
    return;
  } catch (err) {
    throw new Error(`Error al actualizar la relacion: ${err.message}`);
  }
};

const getModelSelected = async (model, options) => {
  try {
    const result = await getInformation(model, options);
    return result;
  } catch (err) {
    throw new Error(`Error al obtener la información: ${err.message}`);
  }
}

const updateNotifiedValue = async (id, value) => {
  console.log(id[0], value)
  try {
    const test = await UsuarioIndicador.update({
      notified: value,
      notifiedAt: new Date()
    }, {
      where: {
        id: id[0]
      }
    });

    console.log(test);
    return;
  }
  catch (err) {
    throw new Error(`Error al actualizar la relación: ${err.message}`);
  }
};

const needsUpdate = (monthDifference, periodicidad, notified, notifiedAt) => {
  return monthDifference >= periodicidad && !notified;
};


const checkForUpdates = async () => {
  const today = new Date();

  const usuarioIndicadores = await UsuarioIndicador.findAll({
    attributes: ['id', 'idUsuario', 'idIndicador', 'notified', 'notifiedAt'],
    include: [{
      model: Indicador,
      attributes: ['id', 'nombre', 'ultimoValorDisponible', 'anioUltimoValorDisponible', 'updatedBy', 'updatedAt', 'periodicidad', 'fuente'],
      where: {
        activo: true,
      }
    },
    {
      model: Usuario,
      attributes: ['id', 'nombres', 'correo'],
      where: {
        activo: true
      }
    }],
  });


  const indicadoresToUpdate = usuarioIndicadores.filter(ui => {
    const updatedAt = ui.indicador.updatedAt;
    const periodicidad = ui.indicador.periodicidad;
    const notified = ui.notified;
    const notifiedAt = ui.notifiedAt;
    const months = differenceInMonths(today, updatedAt);
    return needsUpdate(months, periodicidad, notified, notifiedAt);
  });


  const arrayOfUSers = indicadoresToUpdate.reduce((acc, ui) => {
    const user = acc.find(u => u.id === ui.idUsuario);
    if (user) {
      user.indicadores.push(ui);
    } else {
      acc.push({
        id: ui.idUsuario,
        nombres: ui.usuario.nombres,
        correo: ui.usuario.correo,
        indicadores: [ui]
      });
    }
    return acc;
  }, []);

  await sendToBeupdatedIndicadores(arrayOfUSers, 5000);

}

const sendToBeupdatedIndicadores = async (users, interval) => {
  for (const user of users) {
    const { nombres, correo, indicadores } = user;
    const indicadoresNames = indicadores.map(i => i.indicador.nombre);
    const indicadoresAndExpirationDate = indicadores.map(i => {
      const expirationDate = new Date(i.indicador.updatedAt);
      expirationDate.setMonth(expirationDate.getMonth() + i.indicador.periodicidad);
      const mxexpirationDate = expirationDate.toLocaleDateString('es-MX');

      return {
        nombre: i.indicador.nombre,
        fechaExpiracion: mxexpirationDate,
      };
    });
    const indicadoresNamesString = indicadoresNames.join(', ');
    const salutation = splitNameKeepFirstOne(nombres);


    // Enviar el correo
    await sendEmailToUsuarios(nombres, correo, indicadoresNames, indicadoresNamesString, salutation, indicadoresAndExpirationDate);

    updateNotifiedValue(indicadores.map(i => i.id), true);

    // Esperar antes de enviar el siguiente
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};

const templateFromIndicadoresToBeUpdated = (nombres, indicadoresNamesString, salutation, indicadoresAndExpirationDate) => {
  return `
    <h1>Hola ${nombres}!</h1>
    <p>Este correo es para recordarte que los siguientes indicadores necesitan actualización:</p>
    <ul>
        ${indicadoresAndExpirationDate.map(i => {
    return `<li>${i.nombre} - Fecha de expiración: ${i.fechaExpiracion}</li>`
  })}
    </ul>
    <p>Gracias por tu colaboración!</p>
    `
};

const sendEmailToUsuarios = async (nombres, correo, indicadoresNames, indicadoresNamesString, salutation, indicadoresAndExpirationDate) => {


  await sender(
    'miguel.valdez@implanchihuahua.org',
    'Indicadores pendientes de actualización 🦂',
    salutation,
    templateFromIndicadoresToBeUpdated(nombres, indicadoresNamesString, salutation, indicadoresAndExpirationDate)
  )
}






module.exports = {
  isUsuarioAssignedToIndicador,
  createRelation,
  getUsuariosIndicadores,
  getRelationUsers,
  getUsuariosThatDontHaveIndicador,
  deleteRelation,
  updateRelation,
  createRelationWithModules,
  getModelSelected,
  createRelationUsersToIndicador,
  changeOwner,
  updateNotifiedValue,
  checkForUpdates
}