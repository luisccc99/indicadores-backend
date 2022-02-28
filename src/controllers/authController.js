const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUsuarioByCorreo } = require('../services/usuariosService');
require('dotenv').config();

const { TOKEN_SECRET } = process.env;

const login = async (req, res) => {
    try {
        const { correo, clave } = req.body;

        const existingUser = await getUsuarioByCorreo(correo);

        // compare existing user hashed clave against the hash of the clave in the request
        if (existingUser && await bcrypt.compare(clave, existingUser.clave)) {

            // denied access if account is disabled (status code)
            if (existingUser.activo === 'NO') {
                return res.status(403).json({
                    message: "La cuenta se encuentra deshabilitada"
                });
            }

            // create and sign token (valid up to 5hrs)
            const token = jwt.sign(
                { sub: existingUser.id },
                TOKEN_SECRET,
                { expiresIn: '5h' }
            );
            return res.status(200).json({ token });

        }
        return res.status(401).json({ message: "Credenciales invalidas" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
};

module.exports = { login };