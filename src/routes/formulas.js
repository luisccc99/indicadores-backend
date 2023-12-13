// PATCH de formula
const express = require('express');
const { updateFormula, addVariablesToFormula } = require('../controllers/formulaController');
const { verifyUserHasRoles, verifyUserIsActive, verifyJWT } = require('../middlewares/auth');
const { exists } = require('../middlewares/resourceExists');
const { updateValidationRules } = require('../middlewares/validator/formulaValidator');
const { paramValidationRules, validate, idValidation, joinRules } = require('../middlewares/validator/generalValidator');
const { createVariableValidationRules, variablesChain } = require('../middlewares/validator/variableValidator');
const router = express.Router();

/**
 * @swagger
 *   components:
 *     schemas:
 *       Formula:
 *         type: object
 *         properties:
 *           id:
 *             type: integer
 *             description: Autogenerated id.
 *             example: 1
 *             readOnly: true
 *           ecuacion:
 *             type: string
 *             description: Equation in LaTeX.
 *           descripcion:
 *             type: string
 *             description: Description.
 *           isFormula:
 *             type: string
 *             description: Is this value a formula? (it could come from other sources)
 *             enum: [SI, NO]
 *       FormulaWithVariables:
 *           allOf:
 *             - $ref: '#/components/schemas/Formula'
 *             - type: object
 *               properties:
 *                 variables:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variable'
 */

/**
 * @swagger
 *   /formulas/{idFormula}:
 *     patch:
 *       summary: Updates values of a formula
 *       tags: [Formulas]
 *       security:
 *         - bearer: []
 *       parameters:
 *         - in: path
 *           name: idFormula
 *           required: true
 *           schema:
 *             type: integer 
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Formula'
 *       responses:
 *         204:
 *           description: Updated
 *         401:
 *           $ref: '#/components/responses/Unauthorized'
 *         403:
 *           $ref: '#/components/responses/Forbidden'
 *         404:
 *           $ref: '#/components/responses/NotFound'
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */
router.route('/:idFormula')
  .patch(
    paramValidationRules(),
    updateValidationRules(),
    validate,
    verifyJWT,
    verifyUserIsActive,
    verifyUserHasRoles(['USER', 'ADMIN']),
    exists('idFormula', 'Formula'),
    updateFormula
  );

/**
 * @swagger
 *   /formulas/{idFormula}/variables:
 *     post:
 *       summary: Add one or more variables to a formula
 *       tags: [Formulas, Variables]
 *       security:
 *         - bearer: []
 *       parameters:
 *         - in: path
 *           name: idFormula
 *           required: true
 *           schema:
 *             type: integer
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 variables:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Variable'
 *       responses:
 *         201:
 *           description: Variables added to formula
 *         401:
 *           $ref: '#/components/responses/Unauthorized'
 *         403:
 *           $ref: '#/components/responses/Forbidden'
 *         404:
 *           $ref: '#/components/responses/NotFound'
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */
router.route('/:idFormula/variables')
  .post(
    idValidation(),
    variablesChain(),
    createVariableValidationRules(),
    validate,
    verifyJWT,
    verifyUserIsActive,
    verifyUserHasRoles(['USER', 'ADMIN']),
    exists('idFormula', 'Formula'),
    addVariablesToFormula
  )

module.exports = router;