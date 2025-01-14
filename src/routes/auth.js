const { body, param } = require('express-validator');
const promisedRouter = require('express-promise-router')
const { login, generatePasswordRecoveryToken, handlePasswordRecoveryToken } = require('../controllers/authController');
const { loginValidationRules, tokenValidationRules } = require('../middlewares/validator/authValidator');
const {
  validate,
} = require('../middlewares/validator/generalValidator');

const router = promisedRouter()

/**
 * @swagger
 *   components:
 *     securitySchemes:
 *       bearer:
 *         type: http
 *         scheme: bearer
 *         bearerFormat: JWT
 *     schemas:
 *       BasicError:
 *         type: object
 *         properties:
 *           status:
 *             type: integer
 *             minimum: 400
 *             maximum: 599
 *             description: HTTP status code
 *           message:
 *             type: string
 *             description: Short message with cause of the error
 *     responses:
 *       BadRequest:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicError'
 *             example:
 *               status: 400
 *               message: There is something wrong in the request
 *       Unauthorized:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicError'
 *             example:
 *               status: 401
 *               message: This request requires authentication
 *       Forbidden:
 *         description: Authentication credentials are insufficient to grant access to this resource.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicError'
 *             example:
 *               status: 403
 *               message: User has no access or an invalid token was provided
 *       NotFound:
 *         description: The specified resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicError'
 *             example:
 *               status: 404
 *               message: Resource with id was not found
 *       Conflict:
 *         description: There's a conflict with the specified resource.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicError'
 *             example:
 *               status: 409
 *               message: Resource is not active
 *       PayloadTooLarge:
 *         description: The request has a payload too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicError'
 *             example:
 *               status: 413
 *               message: The document size is too large
 *       UnprocessableEntity:
 *         description: Validation failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 422
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: 'location[field]: Field must be...'
 *       TooManyRequests:
 *         description: App has exceeded its rate limit.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicError'
 *             example:
 *               status: 429
 *               message: Too many requests, try later
 *       InternalServerError:
 *         description: Something went wrong, look into the message response for more details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BasicError'
 *             example:
 *               status: 500
 *               message: Something went wrong
 */

/**
 * @swagger
 *   /auth/login:
 *     post:
 *       summary: Let a client log into the app
 *       description: If a request has valid credentials, this endpoint returns a token to use in every subsequent request
 *       requestBody:
 *         description: User's credentials
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 correo:
 *                   type: string
 *                   example: johndoe@email.com
 *                 clave:
 *                   type: string
 *                   example: password
 *               required:
 *                 - correo
 *                 - clave
 *       tags: [ Auth ]
 *       responses:
 *         200: 
 *           description: Returns a token if credentials are correct.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token:
 *                     type: string
 *                     example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.rTCH8cLoGxAm_xw68z-zXVKi9ie6xJn9tnVWjd_9ftE
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
router.post('/login', loginValidationRules(), validate, login);

/**
 * @swagger
 *   /auth/password-reset:
 *     post:
 *       summary: Starts process to reset a password
 *       tags: [ Auth ]
 *       requestBody:
 *          description: User's email address
 *          required: true
 *          content:
 *            application/json:
 *              schema: 
 *                type: object
 *                properties:
 *                  correo:
 *                    type: string
 *                    example: johndoe@email.com
 *       responses:
 *         200:
 *           description: Sends an email to the address in the body request
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */
router.post('/password-reset',
  body('correo').trim().isEmail(),
  validate,
  generatePasswordRecoveryToken)

/**
 * @swagger
 *   /auth/password-reset/{token}:
 *     patch:
 *       summary: Updates password of a user
 *       tags: [ Auth ]
 *       parameters:  
 *         - in: path
 *           name: token
 *           required: false
 *       requestBody:
 *         description: New password
 *         required: true
 *         content: 
 *           application/json:
 *             schema:
 *               type: object 
 *               properties:
 *                 clave:
 *                   type: string 
 *                   example: newPassword
 *       responses:
 *         200:
 *           description: Updates password succesfully
 *         400:
 *           $ref: '#/components/responses/BadRequest'
 *         401:
 *           $ref: '#/components/responses/Unauthorized'
 *         422:  
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */
router.patch('/password-reset/:token',
  tokenValidationRules(),
  body('clave').notEmpty(),
  param('token').notEmpty().isJWT(),
  validate,
  handlePasswordRecoveryToken)

module.exports = router;