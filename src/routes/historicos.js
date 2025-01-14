

const {
	paramValidationRules,
	validate,
} = require('../middlewares/validator/generalValidator')

const {
	updateHistoricoValidationRules,
} = require('../middlewares/validator/historicoValidator');

const {
	deleteHistorico,
	updateHistorico,
} = require('../controllers/historicoController');

const { verifyJWT, verifyUserIsActive, verifyUserHasRoles } = require('../middlewares/auth');
const { verifyResourceExists } = require('../middlewares/resourceExists');
const { verifyUserCanPerformActionOnIndicador } = require('../middlewares/verifyUserCanPerformAction');


const promisedRouter = require('express-promise-router')
const router = promisedRouter();


// PROTECTED ROUTES
router.use(verifyJWT);
router.use(verifyUserIsActive);
router.use(verifyUserHasRoles(['USER', 'ADMIN']))

/**
 * @swagger
 * /historicos/{idHistorico}:
 *   delete:
 *     summary: Delete a historico
 *     description: Delete a historico using its id
 *     tags: [Historicos]
 *     security:
 *       - bearer: []
 *     parameters:
 *       - name: idHistorico
 *         in: path
 *         required: true
 *         description: The id of the historico
 *         schema:
 *           type: integer
 *         format: int64
 *         minimum: 1
 *     responses:
 *       200:
 *         description: The historico was deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Historico'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:idHistorico',
	paramValidationRules(),
	validate,
	verifyResourceExists({
		routeParam: 'idHistorico',
		model: 'Historico'
	}),
	verifyUserCanPerformActionOnIndicador({ relatedTo: { model: 'Historico', pathId: 'idHistorico' } }),
	deleteHistorico
);

/**
 * @swagger
 *   /historicos/{idHistorico}:
 *     patch:
 *       summary: Update historico with given id and values
 *       tags: [Historicos]
 *       security:
 *         - bearer: []
 *       parameters:
 *         - name: idHistorico
 *           in: path
 *           required: true
 *           description: The id of the historico
 *           schema:
 *             type: integer
 *           format: int64
 *           minimum: 1
 *       responses:
 *         200:
 *           description: The historico was deleted
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Historico'
 *         400:
 *           $ref: '#/components/responses/BadRequest'
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
router.patch('/:idHistorico',
	updateHistoricoValidationRules(),
	paramValidationRules(),
	validate,
	verifyResourceExists({
		routeParam: 'idHistorico',
		model: 'Historico'
	}),
	verifyUserCanPerformActionOnIndicador({ relatedTo: { model: 'Historico', pathId: 'idHistorico' } }),
	updateHistorico
);

module.exports = router;