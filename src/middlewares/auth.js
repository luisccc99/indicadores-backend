const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getRol, isUserActive } = require('../services/usuariosService');
require('dotenv').config();

const { TOKEN_SECRET } = process.env;
const SALT_ROUNDS = 10;
const TOKEN_EXPIRATION_TIME = '5h';


const verifyJWT = (req, res, next) => {
    const reqHeader = req.headers.authorization;
    if (!reqHeader) {
        return res.sendStatus(401);
    }

    const bearerToken = reqHeader.split(' ')[1];
    jwt.verify(bearerToken, TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send('Invalid or expired token');
        }

        req.sub = decoded.sub;
        next();
    });
};

const verifyUserHasRoles = (roles) => async (req, res, next) => {
    const rol = await getRol(req.sub);
    const isAllowed = roles.includes(rol);
    if (!isAllowed) {
        return res.status(403).send('No tiene permiso a realizar acciones en este recurso');
    }

    req.rol = rol;
    next();
};

const verifyUserIsActive = async (req, res, next) => {
    const isActive = await isUserActive(req.sub);
    if (!isActive) {
        return res.status(403).send('Esta cuenta se encuentra deshabilitada');
    }

    next();
}

const hashClave = (clave) => bcrypt.hash(clave, SALT_ROUNDS);

const generateToken = ({ expirationTime = TOKEN_EXPIRATION_TIME, ...payload }) => {
    return jwt.sign({ ...payload }, TOKEN_SECRET, { expiresIn: expirationTime });
}

module.exports = {
    verifyJWT,
    verifyUserHasRoles,
    hashClave,
    generateToken,
    verifyUserIsActive
};