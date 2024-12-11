const express = require('express');
require('dotenv').config();
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path')
const logger = require('./src/config/logger');
const logErrors = require('./src/middlewares/log');
const scheduler = require('./src/middlewares/scheduler');

const PORT = process.env.PORT || 8080;
const env = process.env.NODE_ENV || 'development';
const servers = [
  {
    url: 'http://indicadores-backend.chihuahuametrica.online/',
    description: 'Production Server'
  }
]

if (env === 'development') {
  servers.push({
    url: `http://localhost:${PORT}/api/v1`,
    description: 'Local setup'
  })
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Indicadores API',
      version: '1.0.0',
      description: `The Indicadores API follows the constraints of the 
      REST architectural style. This set of endpoints keep track of urban data.`
    },
    servers
  },
  apis: [`${__dirname}/src/routes/*.js`],

}

const swaggerSpec = swaggerJSDoc(options)

const app = express();

// Enable when behind a reverse proxy (Heroku, Bluemix, AWS ELB or API Gateway, Nginx, etc)
// See https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);

// API throttling (prevent DoS attacks)
app.use(require('./src/middlewares/limiter'));

// Enable CORS for all requests
app.use(cors({ origin: '*' }))

// Prevent common vulnerabilities
const cspDefaults = helmet.contentSecurityPolicy.getDefaultDirectives();
delete cspDefaults['upgrade-insecure-requests'];
app.use(helmet({
  contentSecurityPolicy: { directives: cspDefaults }
}));

// Log HTTP requests with Morgan and Winston
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
  stream: { write: message => logger.http(message.trim()) }
}));

// Parse data from requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API documentation
app.use('/api/v1/documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Define routes
app.use('/api/v1/auth', require('./src/routes/auth'));
app.use('/api/v1/usuarios', require('./src/routes/usuarios'));
app.use('/api/v1/roles', require('./src/routes/roles'));
app.use('/api/v1/temas', require('./src/routes/temas'));
app.use('/api/v1/indicadores', require('./src/routes/indicadores'));
app.use('/api/v1/documentos', require('./src/routes/documentos'));
app.use('/api/v1/me', require('./src/routes/me'));
app.use('/api/v1/historicos', require('./src/routes/historicos'));
app.use('/api/v1/formulas', require('./src/routes/formulas'));
app.use('/api/v1/variables', require('./src/routes/variables'));
app.use('/api/v1/relation', require('./src/routes/usuariosIndicadores'));
app.use('/api/v1/mapas', require('./src/routes/mapas'));
app.use('/api/v1/objetivos', require('./src/routes/objetivos'));
app.use('/api/v1/ods', require('./src/routes/ods'));
app.use('/api/v1/coberturas', require('./src/routes/coberturas'));

if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', (_, res, next) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  })
}

app.use('/uploads/temas/images', express.static(path.join(__dirname, 'uploads', 'temas/images')));
app.use('/uploads/usuarios/images', express.static(path.join(__dirname, 'uploads', 'usuarios/images')));
app.use('/uploads/mapas', express.static(path.join(__dirname, 'uploads', 'mapas')));
app.use(logErrors)

// scheduler();

const server = app.listen(PORT, () => logger.info(`App starting on port ${PORT}`));



module.exports = { server, app };