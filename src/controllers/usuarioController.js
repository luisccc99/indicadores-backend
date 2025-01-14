const { hashClave } = require('../middlewares/auth');
const { createRelation } = require('../services/usuarioIndicadorService');
const { addUsuario,
  getUsuarios,
  isCorreoAlreadyInUse,
  getUsuarioById,
  updateUsuario,
  updateUserStatus,
  countInactiveUsers,
  getUserStatsInfo,
} = require('../services/usuariosService');
const { getImagePathLocation } = require('../utils/stringFormat');
require('dotenv').config();

const getUsers = async (req, res, next) => {
  const page = req.matchedData.page || 1;
  const perPage = req.matchedData.perPage || 25;
  const { searchQuery, activo } = req.matchedData;


  try {
    const { usuarios, total } = await getUsuarios(perPage, (page - 1) * perPage, searchQuery, activo);
    const totalPages = Math.ceil(total / perPage);

    return res.status(200).json({
      page,
      perPage,
      total,
      totalPages,
      data: usuarios
    });
  } catch (err) {
    next(err)
  }
}

const createUser = async (req, res, next) => {
  const { clave, ...values } = req.matchedData;
  const image = getImagePathLocation(req);

  if (await isCorreoAlreadyInUse(values.correo)) {
    return res.status(409).json({ status: 409, message: 'Email is already in use' })
  }

  const hashedClave = await hashClave(clave);

  const savedUser = await addUsuario({
    ...values,
    clave: hashedClave,
    ...image,
  });

  return res.status(201).json({ data: savedUser });
}


const editUser = async (req, res, next) => {
  const idFromToken = req.sub;
  const { idUser } = req.params;
  const values = req.matchedData;
  const id = idUser ? idUser : idFromToken;
  const image = getImagePathLocation(req);

  await updateUsuario(id, { ...values, ...image })
  return res.sendStatus(204);
}

const editUserStatus = async (req, res, next) => {
  const { idUser } = req.params;
  try {
    const updatedUser = await updateUserStatus(idUser);
    if (updatedUser) {
      return res.sendStatus(204);
    }
    return res.sendStatus(400);
  } catch (err) {
    next(err)
  }
};

const getUser = async (req, res, id) => {
  try {
    const usuario = await getUsuarioById(id);
    if (usuario === null) {
      return res.status(404).json({ status: 404, message: `User with id ${id} not found` });
    }
    return res.status(200).json({ data: usuario });
  } catch (err) {
    throw err;
  }
}

const getUserFromId = async (req, res, next) => {
  const id = req.matchedData.idUser;
  try {
    return await getUser(req, res, id)
  } catch (err) {
    next(err)
  }
};

const getUserFromToken = async (req, res, next) => {
  const id = req.sub;
  try {
    return await getUser(req, res, id)
  } catch (err) {
    next(err)
  }
};

const setIndicadoresToUsuario = async (req, res, next) => {

  const { idUser: idUsuario, indicadores, desde, hasta } = req.matchedData;
  const updatedBy = req.sub;
  const createdBy = req.sub;
  try {
    await createRelation(
      [idUsuario],
      [...indicadores],
      {
        createdBy,
        updatedBy
      });
    return res.sendStatus(201);
  } catch (err) {
    next(err)
  }
};


const getUserStats = async (req, res, next) => {
  const { idUser } = req.params;
  try {
    const { indicadores, indicadoresAsignados, temas, temasInactivos, usuarios, usuariosInactivos } = await getUserStatsInfo(idUser);

    return res.status(200).json({
      indicadoresCount: [{ indicadores, indicadoresAsignados }],
      temasCount: [{ temas, temasInactivos }],
      usuarios: [{ usuarios, usuariosInactivos }]
    });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getUsers,
  createUser,
  getUser,
  editUser,
  editUserStatus,
  getUserFromId,
  getUserFromToken,
  setIndicadoresToUsuario,
  getUserStats,
};