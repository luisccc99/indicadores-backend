const express = require('express');
const router = express.Router();

const {
    paramValidationRules,
    validate,
    generalFilterOptions,
    paginationValidationRules,
    generalSortValidationRules,
    idValidation,
} = require('../middlewares/validator/generalValidator');
const { determineModel } = require('../middlewares/determinePathway');
const { getInformation } = require('../controllers/generalController');


router.get('/info/general',
    determineModel,
    generalFilterOptions(),
    paramValidationRules(),
    paginationValidationRules(),
    generalSortValidationRules(),
    validate,
    getInformation
);

module.exports = router;