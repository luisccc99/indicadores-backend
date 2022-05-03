const express = require('express');
const { query } = require('express-validator');

const router = express.Router();
const { getUsers,
    createUser,
    getUserFromId,
    editUser,
    editUserStatus } = require('../controllers/usuarioController');
const { verifyJWT, verifyRoles, verifyUserIsActive } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/fileUpload');
const {
    registerValidationRules,
    paginationValidationRules,
    validate,
    paramValidationRules,
    updateValidationRules } = require('../middlewares/validator');
/**
 * @swagger
 *   components:
 *     schemas:
 *       Usuario:
 *         type: object
 *         required:
 *           - correo
 *           - clave
 *           - nombres
 *           - apellidoPaterno
 *         properties:
 *           id:
 *             type: integer
 *             description: Autogenerated id
 *             example: 1
 *             readOnly: true
 *           correo:
 *             type: string
 *             example: johndoe@email.com
 *             description: Email address of a user
 *           clave:
 *             type: string
 *             description: Password of a user
 *             example: password
 *             writeOnly: true
 *           nombres:
 *             type: string
 *             example: John
 *             description: User's first name (s)
 *           apellidoPaterno:
 *             type: string
 *             example: Doe
 *             description: User's last name
 *           apellidoMaterno:
 *             type: string
 *             nullable: true
 *             example: Smith
 *             description: User's second last name
 *           avatar:
 *             type: string
 *             description: User's profile picture
 *           activo:
 *             type: string
 *             example: SI
 *             description: Is user active?
 *           idRol:
 *             type: int
 *             example: 1
 *             description: User's rol
 *           createAt:
 *             type: string
 *             example: 2021-12-04T22:22:33.836Z
 *             description: Creation date of a user
 *             readOnly: true
 *           updatedAt:
 *             type: string
 *             example: 2021-12-04T22:22:33.836Z
 *             description: Update date of a user
 *             readOnly: true 
 */


/**
 * @swagger
 *   /usuarios:
 *     get:
 *       summary: Retrieve a list of users
 *       description: Retrieve a list of users with pagination
 *       tags: [Usuarios]
 *       security:
 *         - bearer: []
 *       parameters:
 *         - in: query
 *           name: page
 *           required: false
 *           schema:
 *             type: integer
 *           description: The page number
 *           example: 1
 *         - in: query
 *           name: perPage
 *           required: false
 *           schema:
 *             type: integer
 *           description: Number of usuarios in the data array result
 *           example: 25
 *       responses: 
 *         200:
 *           description: A list of users
 *           content:
 *             application/json:
 *               schema: 
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: integer
 *                     example: 1
 *                     description: Page number
 *                   perPage:
 *                     type: integer
 *                     example: 25
 *                     description: Items per page
 *                   total:
 *                     type: integer
 *                     description: Total number of usuarios
 *                   totalPages:
 *                     type: integer
 *                     description: Total number of pages with perPage elements
 *                   data:
 *                     type: array
 *                     items: 
 *                       $ref: '#/components/schemas/Usuario'
 *                     description: List of users                    
 *         401:
 *           description: Unauthorized request (not valid JWT in Authorization header)
 *         403:
 *           description: The request has an invalid token or rol
 *         422:
 *           description: Unable to process request due to semantic errors in the body or param payload
 *       
 */
router.get(
    '/',
    verifyJWT,
    verifyUserIsActive,
    verifyRoles(['ADMIN']),
    paginationValidationRules(),
    query('searchQuery'),
    validate,
    getUsers
);

/**
 * @swagger
 *   /usuarios:
 *     post:
 *       summary: Register new user
 *       tags: [Usuarios]
 *       requestBody: 
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       responses: 
 *         201:
 *           description: Account created successfully 
 *         403:
 *           description: Unable to create account (email is already in use, invalid token or rol)
 *         422:
 *           description: Unable to process request due to semantic errors in the body or param payload
 */
router.post(
    '/',
    verifyJWT,
    verifyUserIsActive,
    verifyRoles(['ADMIN']),
    uploadImage('usuarios'),
    registerValidationRules(),
    validate,
    createUser
);


/**
 * @swagger
 *  /usuarios/{idUsuario}:
 *    get:
 *      summary: Get a user with a given id
 *      tags: [Usuarios]
 *      security:
 *        - bearer: []
 *      parameters:
 *        - in: path
 *          name: idUser
 *          required: true
 *          schema: 
 *            type: integer
 *          style: simple
 *      responses: 
 *        200:
 *          description: Information of a user
 *        204:
 *          description: Not user was found with the given id
 *        401:
 *          description: Unauthorized request (not JWT in Authorization header)
 *        403:
 *          description: The request has an invalid token or rol
 *        422:
 *          description: Unable to process request due to semantic errors in the body or param payload
 */
router.get(
    '/:idUser',
    verifyJWT,
    verifyUserIsActive,
    verifyRoles(['ADMIN']),
    paramValidationRules(),
    validate,
    getUserFromId
);


/**
 * @swagger
 *  /usuarios/{idUsuario}:
 *    patch:
 *      summary: Update user's information
 *      tags: [Usuarios]
 *      security:
 *        - bearer: []
 *      parameters:
 *        - in: path
 *          name: idUser
 *          required: true
 *          schema:
 *              type: integer
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Usuario'
 *      responses:
 *        204:
 *          description: User information was updated successfully
 *        401:
 *          description: Unauthorized request (not valid JWT in Authorization header)
 *        403:
 *          description: The request has an invalid token or rol
 *        422:
 *          description: Unable to process request due to semantic errors in the body or param payload
 */
router.patch(
    '/:idUser',
    verifyJWT,
    verifyUserIsActive,
    verifyRoles(['ADMIN']),
    paramValidationRules(),
    updateValidationRules(),
    validate,
    uploadImage('usuarios'),
    editUser
);


/**
 * @swagger
 *  /usuarios/{idUsuario}/toggle-status:
 *  patch:
 *    summary: Update status of user (if it was active changes to inactive)
 *    tags: [Usuarios]
 *    security:
 *      - bearer: []
 *    parameters:
 *      - in: path
 *        name: idUser
 *        required: true
 *        schema:
 *          type: integer
 *    responses:
 *      204:
 *        description: User status changed successfully
 *      401:
 *        description: Unauthorized request (not valid JWT in Authorization header)
 *      403:
 *        description: The request has an invalid token, rol or privileges (inactive account)
 */
router.patch(
    '/:idUser/toggle-status',
    verifyJWT,
    verifyUserIsActive,
    verifyRoles(['ADMIN']),
    paramValidationRules(),
    validate,
    editUserStatus
)


module.exports = router;