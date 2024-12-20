const {
  validate,
  idValidation,
  formatDocsValidation,
} = require('../middlewares/validator/generalValidator');
const { verifyResourceExists } = require('../middlewares/resourceExists');
const IndicadorController = require('../controllers/indicadorController');
const promisedRouter = require('express-promise-router');
const router = promisedRouter();


/**
 * @swagger
 *   /documentos/{idIndicador}/json:
 *     get:
 *       summary: Indicador in json format
 *       description: Retrieve data of an indicador an generates a JSON file.
 *       tags: [Documentos]
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
 *           headers:
 *             Content-disposition:
 *               schema:
 *                 type: string
 *                 description: Used to specify an application/json attachment
 *                 example: attachment, filename="indicador.json"
 *             Content-Type:
 *               schema:
 *                 type: string
 *                 description: Used to specify the type of the file
 *                 example: application/json
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 *   /documentos/{idIndicador}/pdf:
 *     get:
 *       summary: Indicador datasheet
 *       description: Retrieve data of an indicador an generates a PDF file.
 *       tags: [Documentos]
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
 *           description: Returns PDF file with the data of the indicador
 *           content: 
 *             application/pdf:
 *               schema:
 *                 type: file
 *                 example: pdf
 *           headers:
 *             Content-disposition:
 *               schema:
 *                 type: string
 *                 description: Used to specify an application/pdf attachment
 *                 example: attachment, filename="indicador.pdf"
 *             Content-Type:
 *               schema:
 *                 type: string
 *                 description: Used to specify the type of the file
 *                 example: application/pdf
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 *   /documentos/{idIndicador}/csv:
 *     get:
 *       summary: Indicador in CSV format
 *       description: Retrieve data of an indicador an generates a CSV file.
 *       tags: [Documentos]
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
 *           description: Returns CSV file with the data of the indicador
 *           content: 
 *             application/csv:
 *               schema:
 *                 type: file
 *                 example: id,nombre,definicion,urlImagen,ods,Tema,ultimoValorDisponible,unidadMedida,anioUltimoValorDisponible,coberturaGeografica,tendenciaActual,tendenciaDeseada,mapa,Historicos,Mapa,Formula,1,test national,Blanditiis rerum soluta sit labore laborum tenetur vero.,http://placeimg.com/640/480,Cheese,Indian,53014,Lead,2020,Tactics,ASCENDENTE,ASCENDENTE,1,[{anio:2022,valor:13284,fuente:http://tanya.biz},{anio:2021,valor:28809,fuente:https://virgie.name},{anio:2020,valor:46555,fuente:http://wayne.biz},{anio:2019,valor:28271,fuente:https://krista.name},{anio:2018,valor:83618,fuente:https://clare.net},{anio:2017,valor:58830,fuente:https://dax.net},{anio:2016,valor:60870,fuente:https://phyllis.biz},{anio:2015,valor:57090,fuente:http://neha.name},{anio:2014,valor:27762,fuente:https://alverta.com},{anio:2013,valor:37584,fuente:http://william.org}],{id:1,ubicacion:Rio Rancho,url:http://marlon.name},{id:1,ecuacion:Z=x^2 + y^2,descripcion:Ecuación estándar que sirve para calcular el resultado de la suma de dos números reales eqivalentes a algo,Variables:[{nombre:y,descripcion:Descripción de valor 2,dato:123,Unidad:Lead},{nombre:z,descripcion:Descripción de valor3,dato:123,Unidad:Lead},{nombre:x,descripcion,Descripción de valor 1,dato:123,Unidad:reboot}]}
 *           headers:
 *             Content-disposition:
 *               schema:
 *                 type: string
 *                 description: Used to specify an application/csv attachment
 *                 example: attachment, filename="indicador.csv"
 *             Content-Type:
 *               schema:
 *                 type: string
 *                 description: Used to specify the type of the file
 *                 example: application/csv
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 *   /documentos/{idIndicador}/xlsx:
 *     get:
 *       summary: Indicador in XLSX (Excel) format
 *       description: Retrieve data of an indicador an generates an Excel file.
 *       tags: [Documentos]
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
 *           description: Returns Excel file with the data of the indicador
 *           content: 
 *             application/xlsx:
 *               schema:
 *                 type: file
 *                 example: xlsx
 *           headers:
 *             Content-disposition:
 *               schema:
 *                 type: string
 *                 description: Used to specify an application/xlsx attachment
 *                 example: attachment, filename="indicador.xlsx"
 *             Content-Type:
 *               schema:
 *                 type: string
 *                 description: Used to specify the type of the file
 *                 example: test.xlsx
 *         404:
 *           $ref: '#/components/responses/NotFound'
 *         422:
 *           $ref: '#/components/responses/UnprocessableEntity'
 *         429:
 *           $ref: '#/components/responses/TooManyRequests'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */

router.route('/:idIndicador/:format')
  .get(
    idValidation(),
    formatDocsValidation(),
    validate,
    verifyResourceExists({
      routeParam: 'idIndicador',
      model: 'Indicador',
      isActivo: true
    }),
    IndicadorController.generateFile
  );

module.exports = router;