const { check, validationResult, query, param, matchedData, body } = require('express-validator');
const { validYear } = require('./generalValidator');

const filterIndicadoresValidationRules = () => [
    query(['anioUltimoValorDisponible', 'ods', 'cobertura', 'medida', 'idObjetivo', 'owner', 'tema'])
        .optional()
        .isInt().withMessage('Field must be an integer number')
        .toInt()
        .custom((value) => {
            if (value < 1) {
                throw new Error('valor debe ser mayor a 0');
            }
            return true;
        }),
    query('tendenciaActual')
        .optional()
        .toUpperCase()
        .isIn(['ASCENDENTE', 'DESCENDENTE', 'NO APLICA']),

    query('searchQuery')
        .optional()
        .trim(),

    query(['idObjetivos', 'objetivos.*'])
        .optional()
        .isString(),

    query('temas.*')
        .optional()
        .isInt()
        .toInt()
];


const publicFiltersRules = () => [
    query(['temas.*', 'ods.*', 'coberturas.*', 'objetivos.*'])
        .optional()
        .isInt()
        .toInt()
]

const privateFilterRules = () => [
    query(['temas.*', 'ods.*', 'coberturas.*', 'objetivos.*', 'usuarios.*',])
        .optional()
        .isInt()
        .toInt(),

    query(['idTema', 'idUsuario', 'owner'])
        .optional()
        .isInt()
        .toInt(),
        
    query('activo')
        .optional()
        .isBoolean()
        .toBoolean(),
    query('searchQuery')
        .optional()
        .trim()
]


const sortValidationRules = () => [
    query('sortBy')
        .optional()
        .isIn(['id', 'nombre', 'anio', 'fuente', 'valor', 'periodicidad', 'updatedAt']),
    query('order')
        .optional()
        .toUpperCase()
        .isIn(['ASC', 'DESC'])
        .withMessage('orden debe ser ascendente o descendente'),
];

const createIndicadorValidationRules = () => [
    body(['nombre', 'definicion', 'ultimoValorDisponible'])
        .exists()
        .trim(),

    body('formula.ecuacion')
        .optional()
        .trim()
        .customSanitizer(ecuacion => decodeURIComponent(ecuacion)),

    body('anioUltimoValorDisponible')
        .exists()
        .isNumeric()
        .custom(validYear)
        .toInt(),

    body('periodicidad')
        .isInt({ min: 1 })
        .toInt(),

    body('idTema')
        .exists()
        .isInt().toInt(),

    body('idObjetivo')
        .exists()
        .isInt().toInt(),

    body('formula.isFormula')
        .optional()
        .isIn(['SI', 'NO']),

    body('formula.isFormula')
        .default('NO'),

    body('formula.variables')
        .optional()
        .isArray()
        .customSanitizer(variables => variables.map(v => {
            return typeof v === 'string' ? JSON.parse(v) : v
        })),

    body(['observaciones', 'formula.descripcion', 'historicos.*.fuente',
        'formula.variables.*.descripcion', 'formula.variables.*.nombre',
        'mapa.ubicacion', 'fuente'])
        .optional()
        .trim(),

    body(['historicos.*.anio', 'formula.variables.*.anio'])
        .optional()
        .isNumeric()
        .custom(validYear)
        .toInt(),

    body(['catalogos.*', 'formula.variables.*.idUnidad'])
        .isNumeric()
        .toInt(),

    body(['historicos.*.valor'])
        .optional()
        .isNumeric()
        .toFloat(),

    body('formula.variables.*.dato')
        .optional()
        .trim(),

    body('mapa.url')
        .optional()
        .isURL(),
];

const updateIndicadorValidationRules = () => [
    body([
        'codigo',
        'codigoObjeto'
    ])
        .optional()
        .isLength({ max: 3 })
        .matches(/\d{3}$/),
    body([
        'definicion',
        'fuente',
        'nombre',
        'observaciones',
        'owner',
        'periodicidad',
        'ultimoValorDisponible',
        'updatedBy',
        'idOds'
    ])
        .optional()
        .trim(),
    body([
        'activo',
    ])
        .optional()
        .isBoolean()
        .toBoolean(),
    body('tendenciaActual')
        .optional()
        .toUpperCase()
        .isIn(['ASCENDENTE', 'DESCENDENTE']),
    body([
        'idOds',
        'idCobertura',
        'idUnidadMedida',
        'idTema',
        'idObjetivo',
        'anioUltimoValorDisponible'
    ])
        .optional()
        .isInt().toInt(),
    body([
        'catalogos.*.id',
    ])
        .isInt()
        .toInt(),
    body('temas')
        .optional()
        .isArray()
        .customSanitizer(temas => temas.map(t => {
            return typeof t === 'string' ? JSON.parse(t) : t
        })),
    body('objetivos')
        .optional()
        .isArray()
        .customSanitizer(objetivos => objetivos.map(t => {
            return typeof t === 'string' ? JSON.parse(t) : t
        })),
    body('metas')
        .optional()
        .isArray()
        .customSanitizer(metas => metas.map(t => {
            return typeof t === 'string' ? JSON.parse(t) : t
        })),

    body('archive').optional().isBoolean(),
    body('archive').default(false)
];

module.exports = {
    filterIndicadoresValidationRules,
    sortValidationRules,
    createIndicadorValidationRules,
    updateIndicadorValidationRules,
    publicFiltersRules,
    privateFilterRules
};