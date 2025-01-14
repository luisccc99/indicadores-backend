require('dotenv').config();
const { app } = require("./app");
const logger = require('./src/config/logger');
const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => logger.info(`App starting on port ${PORT}`));

const gracefulShutdown = () => server.close();

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown)

module.exports = { server }