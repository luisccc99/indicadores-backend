const express = require('express');

const router = express.Router();
const { paramValidationRules,
    validate,
    createIndicadorValidationRules,
    updateIndicadorValidationRules,
    paginationValidationRules,
    filterIndicadoresValidationRules,
    sortValidationRules,
    indicadorAssignUsuarioValidationRules,
    desdeHastaDateRangeValidationRules
} = require('../middlewares/validator');
const {
    getIndicador,
    getIndicadores,
    createIndicador,
    updateIndicador,
    updateIndicadorStatus,
    setUsuariosToIndicador,
} = require('../controllers/indicadorController');
const { verifyJWT, verifyUserHasRoles, verifyUserIsActive } = require('../middlewares/auth');
const { determinePathway, SITE_PATH, FRONT_PATH } = require('../middlewares/determinePathway');
const { uploadImage } = require('../middlewares/fileUpload');
const { getCatalogosFromIndicador } = require('../controllers/catalogoController');

/**
 * @swagger
 *   components:
 *     schemas:
 *       Indicador:
 *         type: object
 *         properties:
 *           id:
 *             type: intger
 *             description: Autogenerated id.
 *             example: 1
 *             readOnly: true
 *           urlImagen:   
 *             type: string 
 *             description: URL of the representative image of an indicador.
 *             example: http://example.com/indicador.png
 *           codigo:    
 *             type: string
 *             description: Code for indicador.
 *             example: 'MA001'
 *           codigoObjeto:
 *             type: string
 *             description: SIGMUN code.
 *           nombre:
 *             type: string
 *             description: Name.
 *             example: Almacen de carbono
 *           definicion:
 *             type: string
 *             description: Detailed information about an indicador.
 *             example: El almacén de carbono es un servicio ambiental de regulación, indica la calidad y degradación del suelo. Muestra la cantidad actual de carbono almacenado en un paisaje y valora la cantidad de carbono secuestrado a lo largo del tiempo.
 *           ultimoValorDisponible:
 *             type: string
 *             description: Latest available value.
 *             example: 3.68
 *           anioUltimoValorDisponible:
 *             type: integer
 *             description: Year of latest update.
 *             example: 2020
 *           tendenciaActual:
 *             type: string
 *             description: Tendency based on historical data.
 *             example: Ascendente
 *             readOnly: true
 *           observaciones:
 *             type: string
 *             description: Observations, comments or remarks.
 *           activo:
 *             type: string
 *             description: Is indicador active?
 *           fuente:
 *             type: string
 *             description: Where does the information come from?
 *           periocidad:
 *             type: integer
 *             description: Number of months between updates. 
 *           createdBy:
 *             type: integer
 *             description: Identifier of the user who created this indicador.
 *             example: 1
 *           updatedBy:
 *             type: integer
 *             description: Identifier of the user who updated this indicador.
 *             example: 1
 *           idModulo:
 *             type: integer
 *             description: Modulo (topic) related to the indicador.
 *             writeOnly: true
 *             example: 1
 *       Formula:
 *         type: object
 *         properties:
 *           ecuacion:
 *             type: string
 *             description: Equation in LaTeX.
 *           descripcion:
 *             type: string
 *             description: Description.
 *           variables:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Variable'
 *       Variable:
 *         type: object
 *         properties:
 *           id:
 *             type: integer
 *             readOnly: true
 *             description: Autogenerated id.
 *           nombre:
 *             type: string
 *             description: Name.
 *           codigoAtributo:
 *             type: string
 *             description: SIGMUN code.
 *           nombreAtributo:
 *             type: string 
 *             description: Description.
 *           dato:
 *             type: string
 *             description: Value.
 *           anio:
 *             type: integer
 *             description: Year.
 *             example: 2022
 *           idUnidad:
 *             type: integer
 *             writeOnly: true
 *             description: Identifier of the unit of measurement.
 *           idFormula:
 *             type: integer
 *             writeOnly: true
 *             description: Identifier of the formula this variable belongs to.
 *       Historico:
 *         type: object
 *         properties:
 *           id:
 *             type: integer
 *             readOnly: true
 *             description: Autogenerated id.
 *           valor:
 *             type: string
 *             description: Historical value.
 *           anio:
 *             type: integer
 *             description: Historical year.
 *             example: 2022
 *           fuente:
 *             type: string
 *             description: Where does the information come from?
 *       Mapa:
 *         type: object
 *         properties:
 *           id:    
 *             type: integer
 *             description: Autogenerated id.
 *             readOnly: true
 *           ubicacion:
 *             type: string
 *             description: Location (local file).
 *           url:
 *             type: string
 *             description: URL to display map.
 *             example: 'http://example.com/map'
 */

/**
 * @swagger
 *   /indicadores/{idIndicador}:
 *     get:
 *       summary: Get information about an indicador.
 *       description: Retrieve indicador with given id.
 *       tags: [Indicadores]
 *       parameters:
 *         - name: idIndicador
 *           in: path
 *           required: true
 *           schema:
 *             type: integer
 *             format: int64
 *             minimum: 1
 *       responses:
 *         200:
 *           description: Indicador object
 *           content: 
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Indicador'
 *         404:
 *           $ref: '#/components/responses/NotFound'
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */
router.route('/:idIndicador').get(
    paramValidationRules(),
    filterIndicadoresValidationRules(),
    validate,
    determinePathway(SITE_PATH),
    getIndicador
);

/**
 * @swagger
 *   /indicadores:
 *     get:
 *       summary: Retrieves a list of indicadores
 *       tags: [Indicadores]
 *       security:
 *         - bearer: []
 *       parameters:
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *         - in: query
 *           name: perPage
 *           schema:
 *             type: integer
 *         - in: query
 *           name: searchQuery
 *           description: A search query to filter list of indicadores by nombre, definicion, codigo, or observaciones
 *           required: false
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: List of indicadores
 *           content:
 *             application/json:
 *               schema: 
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: integer
 *                     example: 1
 *                   perPage:
 *                     type: integer
 *                     example: 25
 *                   total:
 *                     type: integer
 *                     example: 50
 *                   totalPages:
 *                     type: integer
 *                     example: 2
 *                   data:
 *                     type: array
 *                     items: 
 *                       $ref: '#/components/schemas/Indicador'
 *         401:
 *           $ref: '#/components/responses/Unauthorized'
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */

router.route('/')
    .get(verifyJWT,
        paginationValidationRules(),
        sortValidationRules(),
        filterIndicadoresValidationRules(),
        validate,
        determinePathway(FRONT_PATH),
        getIndicadores);


/**
 * @swagger
 *   /indicadores:
 *     post:
 *       summary: Creates a new indicador
 *       tags: [Indicadores]
 *       security:
 *         - bearer: []
 *       requestBody:
 *         required: true
 *         content: 
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Indicador'
 *       responses:
 *         201:
 *           description: Indicador created successfully
 *           content:
 *             application/json:
 *                schema:
 *                  $ref: '#/components/schemas/Indicador'
 *         401: 
 *           $ref: '#/components/responses/Unauthorized'
 *         403: 
 *           $ref: '#/components/responses/Forbidden'
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */
router.route('/').post(
    verifyJWT,
    verifyUserIsActive,
    verifyUserHasRoles(['ADMIN']),
    createIndicadorValidationRules(),
    validate,
    createIndicador
);

/**
 * @swagger
 *   /indicadores:
 *     patch:
 *       summary: Update Indicador.
 *       description: Users can only update their indicadores (the ones assigned to them).
 *       tags: [Indicadores]
 *       security:
 *         - bearer: []
 *       parameters:
 *         - in: path
 *           name: idIndicador
 *           schema:
 *             type: integer
 *           required: true
 *           description: Identifier of an indicador.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Indicador'
 *       responses:
 *         204:
 *           description: Updated
 *         401:
 *           $ref: '#/components/responses/Unauthorized'
 *         403:
 *           $ref: '#/components/responses/Forbidden'
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */
router.route('/:idIndicador')
    .patch(
        verifyJWT,
        verifyUserIsActive,
        paramValidationRules(),
        uploadImage('indicadores'),
        updateIndicadorValidationRules(),
        validate,
        updateIndicador
    );

/**
 * @swagger
 *  /indicadores/{idIndicador}/toggle-status:
 *  patch:
 *    summary: Update status of indicador (if it was active, changes to inactive)
 *    tags: [Indicadores]
 *    security:
 *      - bearer: []
 *    parameters:
 *      - in: path
 *        name: idIndicador
 *        required: true
 *        schema:
 *          type: integer
 *    responses:
 *      204:
 *        description: Updated
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      422:
 *        $ref: '#components/responses/UnprocessableEntity'
 *      429:
 *        $ref: '#components/responses/TooManyRequests'
 *      500:
 *        $ref: '#components/responses/InternalServerError'
 */
router.route('/:idIndicador/toggle-status')
    .patch(
        verifyJWT,
        verifyUserIsActive,
        verifyUserHasRoles(['ADMIN']),
        paramValidationRules(),
        validate,
        updateIndicadorStatus
    );


/**
 * @swagger
 *   /indicadores/{idIndicador}/usuarios:
 *   post:
 *     summary: Assigns users to an indicador
 *     description: Only ADMIN users can create associations between normal users and indicadores
 *     tags: [Indicadores]
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: idIndicador
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuarios:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3, 4, 5]
 *               desde:
 *                 type: string
 *                 format: date
 *               hasta:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Operation was successful (users are assigned to an indicador)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#components/responses/UnprocessableEntity'
 *       429:
 *         $ref: '#components/responses/TooManyRequests'
 *       500:
 *         $ref: '#components/responses/InternalServerError'
 */
router.route('/:idIndicador/usuarios')
    .post(
        verifyJWT,
        verifyUserIsActive,
        verifyUserHasRoles(['ADMIN']),
        paramValidationRules(),
        indicadorAssignUsuarioValidationRules(),
        desdeHastaDateRangeValidationRules(),
        validate,
        setUsuariosToIndicador
    );

/**
 * @swagger
 *   /indicadores/{idIndicador}/catalogos:
 *     get:
 *       summary: Retrieve the catalogos associated to an indicador.
 *       tags: [Indicadores]
 *       security: 
 *         - bearer: []
 *       parameters:
 *         - in: path
 *           name: idIndicador
 *           required: true
 *           schema:
 *             type: integer
 *             format: int64
 *       responses:
 *         200:
 *           description: List of catalogos.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         idIndicador:
 *                           type: integer
 *                         idCatalogoDetail:
 *                           type: integer
 *                         nombreAtributo: 
 *                           type: string
 *                         idCatalogo:
 *                           type: integer
 *         401:
 *           $ref: '#/components/responses/Unauthorized'
 *         403:
 *           $ref: '#/components/responses/Forbidden'
 *         422:
 *           $ref: '#components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#components/responses/TooManyRequests'
 *         500:
 *           $ref: '#components/responses/InternalServerError'
 */
router.route('/:idIndicador/catalogos')
    .get(
        paramValidationRules(),
        validate,
        getCatalogosFromIndicador
    )

module.exports = router;