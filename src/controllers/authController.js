'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  getUsuarioByCorreo,
  getUsuarioById,
  updateUserPassword,
  updateUserPasswordStatus
} = require('../services/usuariosService');
require('dotenv').config();

const { TOKEN_SECRET } = process.env;

const { sendEmail } = require('../services/emailSenderService');
const { generateToken, hashClave } = require('../middlewares/auth');

const login = async (req, res, next) => {
  const { correo, clave } = req.matchedData;
  try {
    const existingUser = await getUsuarioByCorreo(correo);
    if (!existingUser) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    if (!existingUser.activo) {
      return res.status(403).json({
        message: "La cuenta se encuentra deshabilitada"
      });
    }

    const passwordMatch = await bcrypt.compare(clave, existingUser.clave)

    if (passwordMatch) {
      const token = generateToken({ sub: existingUser.id });
      return res.status(200).json({ token });
    } else {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

  } catch (err) {
    next(err)
  }
};

const generatePasswordRecoveryToken = async (req, res, next) => {
  try {
    const { correo } = req.body;
    const existingUser = await usuariosService.getUsuarioByCorreo(correo);
    if (existingUser) {
      const token = jwt.sign({
        sub: existingUser.id,
        user: { nombres: existingUser.nombres, correo: existingUser.correo }
      },
        TOKEN_SECRET,
        { expiresIn: '2h' }
      );

      if (existingUser.requestedPasswordChange === 'NO') {
        const updater = await updateUserPasswordStatus(existingUser.id);
      }
      const sender = await sendEmail(existingUser, token);
      if (sender) {
        return res.status(200).json({ message: 'Se ha enviado un correo de recuperación de contraseña' });
      }
    }
    return res.status(404).json({ message: "El usuario no existe" });
  } catch (err) {
    next(err)
  }
};

const handlePasswordRecoveryToken = async (req, res, next) => {
  try {
    const token = req.matchedData.token;
    const { clave } = req.body;
    const decoded = jwt.verify(token, TOKEN_SECRET);
    const user = await getUsuarioById(decoded.sub);
    if (clave && user && user.requestedPasswordChange === 'SI') {
      const hashedPassword = await hashClave(clave);
      const updatePassword = await updateUserPassword(user.id, hashedPassword);
      const changeStatus = await updateUserPasswordStatus(user.id);
      if (updatePassword && changeStatus) {
        return res.status(200).json({ message: "Contraseña actualizada" });
      }
      return res.status(400).json({ message: "Error al actualizar contraseña" });
    }

    if (user.requestedPasswordChange === 'NO') {
      return res.status(401).json({ message: "El usuario no ha solicitado un cambio de contraseña" });
    }

    return res.status(401).json({ message: "Token invalido" });
  } catch (err) {
    next(err)
  }
}

module.exports = { login, generatePasswordRecoveryToken, handlePasswordRecoveryToken };