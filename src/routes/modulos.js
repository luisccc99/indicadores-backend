const express = require('express');

const moduloRouter = express.Router();
const indicadorRouter = express.Router({ mergeParams: true });
const { getModulos, createModulo, editModulo, updateModuloStatus, getModulo } = require('../controllers/moduloController');
const { getIndicadores } = require('../controllers/indicadorController');
const { paramValidationRules, paginationValidationRules,
    validate, filterIndicadoresValidationRules, sortValidationRules,
    createModuloValidationRules, updateModuloValidationRules } = require('../middlewares/validator');
const { moduloExists } = require('../middlewares/verifyIdModulo');
const { verifyJWT, verifyUserIsActive, verifyUserHasRoles } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/fileUpload');
const { determinePathway, SITE_PATH } = require('../middlewares/determinePathway');

/**
 * @swagger
 *   components:
 *     schemas:
 *       Modulo:
 *         type: object
 *         properties:
 *           id:
 *             type: integer
 *             description: Autogenerated id.
 *             example: 1
 *             readOnly: true
 *           temaIndicador:
 *             type: string
 *             description: Topic name.
 *             example: Indicador de accesibilidad ciclista
 *           codigo:
 *             type: string
 *             description: Code.
 *             example: 'MPO201'
 *           observaciones:
 *             type: string
 *             description: Observations, comments or remarks.
 *             example: Modulo de accesibilidad ciclista, definido por la norma ISO/IEC 9126-1:2015
 *           activo:
 *             $ref: '#/components/schemas/Status'
 *           urlImagen:
 *             type: string
 *             format: binary
 *             description: Image URL.
 *             example: http://example.com/image.png
 *           color:
 *             type: string
 *             description: Representative hexadecimal color.
 *             example: '#d2d2d2'
 *           createdAt:
 *             type: string 
 *             description: Timestamp of creation in 'Z time'.
 *             format: date-time
 *             readOnly: true
 */
moduloRouter.use('/:idModulo/indicadores', indicadorRouter);


/**
 * @swagger
 *   /modulos:
 *     get:
 *       summary: Retrieves a list of modules
 *       description: Retrieves a list of modules from the database
 *       tags: [Modulos]
 *       responses:
 *         200:
 *           description: List of topics (modulos).
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items: 
 *                       $ref: '#/components/schemas/Modulo'
 *                     description: List of modules
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */
moduloRouter.route('/')
    .get(getModulos);


/**
 * @swagger
 *   /modulos/{idModulo}/indicadores:
 *     get:
 *       summary: Retrieves a list of indicadores after validation
 *       description: Retrieves a list of indicadores from the database after pagination validation
 *       tags: [Modulos]
 *       parameters:
 *         - name: idModulo
 *           in: path
 *           required: true
 *           schema:
 *             type: integer
 *             format: int64
 *             minimum: 1
 *             description: Identifier of a module
 *         - name: page
 *           in: query
 *           required: false
 *           schema:
 *             type: integer
 *             format: int64
 *             minimum: 1
 *             description: Page number
 *         - name: perPage
 *           in: query
 *           required: false
 *           schema:
 *             type: integer
 *             format: int64
 *             minimum: 1
 *             description: Number of elements per page
 *         - name: idOds
 *           in: query
 *           required: false
 *           schema:
 *             type: integer
 *             format: int64
 *             description: Identifier of an ODS
 *         - name: idCobertura
 *           in: query
 *           required: false
 *           schema:
 *             type: integer
 *             format: int64
 *             description: Identifier of an coverage
*         - name: idUnidadMedida
 *           in: query
 *           required: false
 *           schema:
 *             type: integer
 *             format: int64
 *             description: Identifier of an unit of measure
 *         - name: anioUltimoValorDisponible
 *           in: query
 *           required: false
 *           schema:
 *             type: integer
 *             format: int64
 *             description: Identifier of an year
 *         - name: tendenciaActual
 *           in: query
 *           required: false
 *           schema:
 *             type: string
 *             format: string
 *             description: Identifier of an trend
 *         - in: query
 *           name: searchQuery
 *           required: false
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: A list of indicadores.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Indicador'
 *         404:
 *           $ref: '#/components/responses/NotFound'
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 * 
 */

indicadorRouter.route('/')
    .get(
        paramValidationRules(),
        paginationValidationRules(),
        filterIndicadoresValidationRules(),
        sortValidationRules(),
        validate,
        moduloExists,
        determinePathway(SITE_PATH),
        getIndicadores
    );


/**
 * @swagger
 * /modulos:
 *   post:
 *     summary: Creates a new module
 *     tags: [Modulos]
 *     security:
 *       - bearer: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Modulo'
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Modulo'
 *     responses:
 *       201:
 *         description: Module created successfully.
 *       409:
 *         description: Unable to create new modulo (temaIndicador is already in use).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicError'
 *             example:
 *               status: 409
 *               message: temaIndicador is already in use
 *       401:
 *         $ref: '#components/responses/Unauthorized'
 *       403:
 *         $ref: '#components/responses/Forbidden'
 *       422:
 *         $ref: '#components/responses/UnprocessableEntity'
 *       429:
 *         $ref: '#components/responses/TooManyRequests'
 *       500:
 *         $ref: '#components/responses/InternalServerError'
 */

moduloRouter.route('/')
    .post(
        verifyJWT,
        verifyUserIsActive,
        verifyUserHasRoles(['ADMIN']),
        uploadImage('modulos'),
        createModuloValidationRules(),
        validate,
        createModulo
    );


/** 
 * @swagger
 *   /modulos/{idModulo}:
 *     put:
 *      summary: Updates a module with given parameters
 *      tags: [Modulos]
 *      parameters:
 *        - name: idModulo
 *          in: path
 *          required: true
 *          schema:
 *            type: integer
 *            format: int64
 *            minimum: 1
 *            description: Identifier of a module
 *      security:
 *        - bearer: []
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Modulo'
 *      responses:
 *        204:
 *          description: Module updated successfully
 *        401:
 *          $ref: '#components/responses/Unauthorized'
 *        403:
 *          $ref: '#components/responses/Forbidden'
 *        422:
 *          $ref: '#components/responses/UnprocessableEntity'
 *        429:
 *          $ref: '#components/responses/TooManyRequests'
 *        500:
 *          $ref: '#components/responses/InternalServerError'
 * 
 */

moduloRouter.route('/:idModulo')
    .put(
        verifyJWT,
        verifyUserIsActive,
        verifyUserHasRoles(['ADMIN']),
        updateModuloValidationRules(),
        validate,
        editModulo
    );


/**
 * @swagger
 *   /modulos/{idModulo}:
 *     patch:
 *       summary: Updates a modulo status (active/inactive)
 *       tags: [Modulos]
 *       security:
 *         - bearer: []
 *       parameters:
 *         - name: idModulo
 *           in: path
 *           required: true
 *           schema:
 *             type: integer
 *             format: int64
 *             minimum: 1
 *             description: Identifier of a module
 *       responses:
 *         204:
 *           description: Module status updated successfully
 *         401:
 *           $ref: '#components/responses/Unauthorized'
 *         403:
 *           $ref: '#components/responses/Forbidden'
 *         422:
 *           $ref: '#components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#components/responses/TooManyRequests'
 *         500:
 *           $ref: '#components/responses/InternalServerError'
 */

moduloRouter.route('/:idModulo')
    .patch(
        verifyJWT,
        verifyUserIsActive,
        verifyUserHasRoles(['ADMIN']),
        updateModuloValidationRules(),
        validate,
        updateModuloStatus
    );


/**
 * @swagger
 *   /modulos/{idModulo}:
 *     get:
 *       summary: Retrieves information about a tema (modulo)
 *       tags: [Modulos]
 *       parameters: 
 *         - name: idModulo
 *           in: path
 *           required: true
 *           schema:
 *             type: integer
 *             format: int64
 *             minimum: 1
 *             description: Identifier of a modulo
 *       responses:
 *         200:
 *           description: A modulo object with public fields
 *         404:
 *           description: Modulo with given id does not exist
 *         422:
 *           description: Unable to process request due to semantic errors
 *         429:
 *           description: The app has exceeded its rate limit
 */
moduloRouter.route('/:idModulo')
    .get(
        paramValidationRules(),
        validate,
        getModulo
    );

module.exports = moduloRouter;