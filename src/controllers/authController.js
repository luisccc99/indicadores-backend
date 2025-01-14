const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  getUsuarioByCorreo,
  getUsuarioById,
  updateUserPassword,
  toggleUsuarioRequestPasswordChange
} = require('../services/usuariosService');
const emailSenderService = require('../services/emailSenderService');

require('dotenv').config();

const { TOKEN_SECRET } = process.env;

const { generateToken, hashClave } = require('../middlewares/auth');

const login = async (req, res, next) => {
  const { correo, clave } = req.matchedData;
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
};

const generatePasswordRecoveryToken = async (req, res, next) => {
  const { correo } = req.matchedData;
  const existingUser = await getUsuarioByCorreo(correo);
  if (!existingUser) {
    return res.status(404).json({ message: 'El usuario no existe' });
  }

  const token = generateToken({
    expirationTime: '2h',
    sub: existingUser.id,
    user: { nombres: existingUser.nombres, correo: existingUser.correo }
  })

  if (!existingUser.requestedPasswordChange) {
    await toggleUsuarioRequestPasswordChange(existingUser.id);
  }
  await emailSenderService.sendEmail(existingUser, token);

  return res.status(200).json({ message: 'Se ha enviado un correo de recuperación de contraseña' });
};

const handlePasswordRecoveryToken = async (req, res, next) => {
  const { token, clave } = req.matchedData;
  try {
    const decoded = jwt.verify(token, TOKEN_SECRET);

    const user = await getUsuarioById(decoded.sub);

    if (!user.activo) {
      return res.status(409).json({ message: "El usuario se encuentra inactivo" })
    }
    if (!user.requestedPasswordChange) {
      return res.status(409).json({ message: "El usuario no ha solicitado un cambio de contraseña" });
    }

    const hashedPassword = await hashClave(clave);
    await updateUserPassword(user.id, hashedPassword);
    await toggleUsuarioRequestPasswordChange(user.id);

    return res.status(200).json({ message: "Contraseña actualizada" });

  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: 'Token invalido' });
    }
    throw err;
  }
}

module.exports = { login, generatePasswordRecoveryToken, handlePasswordRecoveryToken };