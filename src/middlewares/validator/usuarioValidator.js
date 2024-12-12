const { body } = require('express-validator');

const registerValidationRules = () => [
    body('correo')
        .isEmail()
        .withMessage('El correo tiene un formato incorrecto'),

    body('clave')
        .isLength({ min: 8 })
        .withMessage('La clave debe tener al menos 8 caracteres'),

    body('nombres')
        .exists()
        .withMessage('por favor agrega un nombre')
        .isAlpha('es-ES', { ignore: '\s' })
        .withMessage('nombre invalido'),

    body('apellidoPaterno')
        .exists()
        .withMessage('por favor agrega apellido paterno')
        .isAlpha('es-ES', { ignore: '\s' })
        .withMessage('apellido paterno invalido'),

    body('apellidoMaterno')
        .optional()
        .isAlpha('es-ES', { ignore: '\s' })
        .withMessage('apellido materno invalido'),

    body('activo')
        .optional()
        .toUpperCase()
        .isBoolean()
        .toBoolean()
        .withMessage('estado invalido'),

    body('idRol')
        .exists('El rol es un campo requerido')
        .isInt('El rol debe ser entero')
        .toInt()
];

const updateValidationRules = () => [
    body('correo')
        .optional()
        .isEmail()
        .withMessage('El correo tiene un formato incorrecto'),

    body('clave')
        .optional()
        .isLength({ min: 8 })
        .withMessage('La clave debe tener al menos 8 caracteres'),

    body('nombres')
        .optional()
        .isAlpha('es-ES', { ignore: '\s' })
        .withMessage('nombre invalido'),

    body('apellidoPaterno')
        .optional()
        .isAlpha('es-ES', { ignore: '\s' })
        .withMessage('apellido paterno invalido'),

    body('apellidoMaterno')
        .optional()
        .isAlpha('es-ES', { ignore: '\s' })
        .withMessage('apellido materno invalido'),

    body('activo')
        .optional()
        .toUpperCase()
        .isIn(['SI', 'NO'])
        .withMessage('estado invalido'),

    body('descripcion')
        .optional()
        .isLength({ min: 1 })
        .withMessage('descripcion debe tener al menos 1 caracter'),
];

const updateProfileValidationRules = () => [
    body('correo')
        .optional()
        .isEmail()
        .withMessage('El correo tiene un formato incorrecto'),

    body(['nombres', 'apellidoPaterno', 'apellidoMaterno',  'descripcion'])
        .optional()
        .isAlpha('es-ES', { ignore: '\s' })
        .withMessage('Valor invalido'),
];


module.exports = {
    registerValidationRules,
    updateValidationRules,
    updateProfileValidationRules
}