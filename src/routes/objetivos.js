const express = require('express');
const { generalFilterOptions, paramValidationRules, paginationValidationRules, generalSortValidationRules, validate } = require('../middlewares/validator/generalValidator');
const { countIndicadoresByObjetivo, editObjetivo, getObjetivo, getTemasInObjetivo, getObjetivos } = require('../controllers/objetivoController');
const { verifyJWT, verifyUserIsActive, verifyUserHasRoles } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/fileUpload');
const { DESTINATIONS } = require('../services/fileService');
const { updateObjetivoalidationRules } = require('../middlewares/validator/objetivoValidator');
const { verifyResourceExists } = require('../middlewares/resourceExists');

const { getIndicadores, getIndicadoresOfObjetivo } = require('../controllers/indicadorController');
const {
    filterIndicadoresValidationRules,
    sortValidationRules,
} = require('../middlewares/validator/indicadorValidator')
const { determinePathway, SITE_PATH, determineModel } = require('../middlewares/determinePathway');
const { default: PromiseRouter } = require('express-promise-router');
const { param } = require('express-validator');
const { getInformation } = require('../controllers/generalController');

const router = PromiseRouter();

router.get('/',
    determineModel,
    generalFilterOptions(),
    paramValidationRules(),
    paginationValidationRules(),
    generalSortValidationRules(),
    validate,
    getObjetivos
);

router.get('/info/general',
    determineModel,
    generalFilterOptions(),
    paramValidationRules(),
    paginationValidationRules(),
    generalSortValidationRules(),
    validate,
    countIndicadoresByObjetivo
);

router.route('/:idObjetivo/indicadores')
    .get(
        param('idObjetivo').isInt().toInt(),
        paginationValidationRules(),
        sortValidationRules(),
        filterIndicadoresValidationRules(),
        validate,
        getIndicadoresOfObjetivo
    );

router.get('/:idObjetivo/temas',
    paramValidationRules(),
    validate,
    getTemasInObjetivo
);

router.patch('/:idObjetivo',
    verifyJWT,
    verifyUserIsActive,
    verifyUserHasRoles(['ADMIN']),
    uploadImage(DESTINATIONS.OBJETIVOS),
    updateObjetivoalidationRules(),
    validate,
    verifyResourceExists({
        routeParam: 'idObjetivo',
        model: 'Objetivo'
    }),
    editObjetivo
);

router.get('/:idObjetivo',
    paramValidationRules(),
    validate,
    getObjetivo
)


module.exports = router;