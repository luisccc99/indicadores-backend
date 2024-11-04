const schedule = require('node-schedule');
const { Indicador } = require('../models');

const checkForUpdates = async (err, req, res, next) => {
    schedule.scheduleJob(' */6 * * * *', async () => {
        const indicadores = await Indicador.findAll();
    });
    return 1;
}

module.exports = checkForUpdates;