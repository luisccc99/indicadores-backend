const schedule = require('node-schedule');
const { checkForUpdates } = require('../services/usuarioIndicadorService');

const checkIndicadorUpdateStatus = async (err, req, res, next) => {
    /** 0 23 * * 0 se traduce como:
     * 1. 0: Ejecutar en el minuto 0,
     * 2. 23: En la hora 23
     * 3. *: Cada día del mes
     * 4. *: Cada mes
     * 5. 0: Index del día de la semana (0 = Domingo)
     */

    schedule.scheduleJob('0 23 * * 0', async () => {

        await checkForUpdates();
    });

    return 1;
};

module.exports = checkIndicadorUpdateStatus;