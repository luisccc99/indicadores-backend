const schedule = require('node-schedule');
const { Indicador } = require('../models');

const checkForUpdates = async (err, req, res, next) => {
    schedule.scheduleJob(' */6 * * * *', async () => {
        const indicadores = await Indicador.findAll();
        console.log(indicadores);
        console.log('#####################')
        console.log('last train to london')
        console.log('#####################')
    });
    return 1;
}

module.exports = checkForUpdates;