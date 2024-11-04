const { body } = require("express-validator")
const { validYear } = require("./generalValidator")

const createVariableValidationRules = () => [
  body('variables.*.anio')
    .if(body('variables').exists())
    .isNumeric()
    .custom(validYear)
    .toInt(),

  body('variables.*.unidadMedida')
    .if(body('variables').exists()),

  body('variables.*.dato')
    .if(body('variables').exists())
    .isNumeric()
    .toFloat(),

  body(['variables.*.descripcion', 'variables.*.nombre'])
    .if(body('variables').exists())
    .trim(),
]

const variablesChain = () => {
  return body('variables')
    .exists()
    .isArray({ min: 0 }).bail()
    .customSanitizer(variables => variables.map(v => {
      return typeof v === 'string' ? JSON.parse(v) : v
    }))
}

const updateVariableValidationRules = () => [
  body('anio')
    .optional()
    .isNumeric()
    .custom(validYear)
    .toInt(),

  body('unidadMedida')
    .optional(),

  body('dato')
    .optional()
    .isNumeric()
    .toFloat(),

  body(['descripcion', 'nombre'])
    .optional()
    .trim()
]

module.exports = { createVariableValidationRules, variablesChain, updateVariableValidationRules }