const { check, validationResult, query, param, matchedData, body } = require('express-validator');


const indicadorAssignUsuarioValidationRules = () => [
    body('usuarios.*').isInt().toInt(),
    body(['desde', 'hasta', 'expires'])
        .optional()
];

const relationAssignValidationRules = () => [
    body('ids.*').isInt().toInt(),
]

const assignationValidationRules = () => [
    body('indicadores.*').isInt().toInt(),
    body('usuarios.*').isInt().toInt(),
]

const userRelationAssignationValidationRules = () => [
    query('ids.*').isInt().toInt(),
]

const changeOwnerValidationRules = () => [
    body('idUsuario').isInt().toInt(),
]

const filterRelationValidationRules = () => [
    query('searchQuery')
        .optional()
];

const sortValidationRules = () => [
    query('sort')
        .optional()
        .isIn(['id', 'idUsuario', 'idIndicador', 'desde', 'hasta'])
        .withMessage('sort must be id, idUsuario, idIndicador, desde, hasta'),
    query('order')
        .optional()
        .toUpperCase()
        .isIn(['ASC', 'DESC'])
        .withMessage('order must be asc or desc'),
]

const idValidation = () => {
    return param(['idIndicador'])
        .optional()
        .isInt().withMessage('Field must be an integer number').bail()
        .toInt()
        .custom((value) => {
            if (value < 1) {
                throw new Error('Value must be greater than 0');
            }
            return true;
        })
}

module.exports = {
    relationAssignValidationRules,
    indicadorAssignUsuarioValidationRules,
    filterRelationValidationRules,
    sortValidationRules,
    userRelationAssignationValidationRules,
    idValidation,
    changeOwnerValidationRules,
    assignationValidationRules,
}