const schedule = require('node-schedule');
const { Indicador, UsuarioIndicador, Usuario } = require('../models');
const { differenceInMonths } = require('date-fns');
const sender = require('./mailSender');

const checkForUpdates = async (err, req, res, next) => {
    schedule.scheduleJob(' */1 * * * *', async () => {

        const today = new Date();

        const usuarioIndicadores = await UsuarioIndicador.findAll({
            attributes: ['id', 'idUsuario', 'idIndicador', 'notified', 'notifiedAt'],
            include: [{
                model: Indicador,
                attributes: ['id', 'nombre', 'ultimoValorDisponible', 'anioUltimoValorDisponible', 'updatedBy', 'updatedAt', 'periodicidad', 'fuente'],
                where: {
                    activo: true,
                    id: [1, 148]
                }
            },
            {
                model: Usuario,
                attributes: ['id', 'nombres', 'correo'],
                where: {
                    activo: 'SI'
                }
            }],
        });

        const indicadoresToUpdate = usuarioIndicadores.filter(ui => {
            const updatedAt = ui.indicador.updatedAt;
            const periodicidad = ui.indicador.periodicidad;
            const notified = ui.notified;
            const notifiedAt = ui.notifiedAt;
            const months = differenceInMonths(today, updatedAt);
            return needsUpdate(months, periodicidad, notified, notifiedAt);
        })

        const arrayOfUSers = indicadoresToUpdate.reduce((acc, ui) => {
            const user = acc.find(u => u.id === ui.idUsuario);
            if (user) {
                user.indicadores.push(ui);
            } else {
                acc.push({
                    id: ui.idUsuario,
                    nombres: ui.usuario.nombres,
                    correo: ui.usuario.correo,
                    indicadores: [ui]
                });
            }
            return acc;
        }, []);


        arrayOfUSers.forEach(user => {
            const { nombres, correo, indicadores } = user;
            const indicadoresNames = indicadores.map(i => i.indicador.nombre);
            const indicadoresAndExpirationDate = indicadores.map(i => {
                const expirationDate = new Date(i.indicador.updatedAt);
                expirationDate.setMonth(expirationDate.getMonth() + i.indicador.periodicidad);
                return {
                    nombre: i.indicador.nombre,
                    fechaExpiracion: expirationDate
                }
            });
            const indicadoresNamesString = indicadoresNames.join(', ');
            const salutation = splitNameKeepFirstOne(nombres);
            sendEmail(nombres, correo, indicadoresNames, indicadoresNamesString, salutation, indicadoresAndExpirationDate);
        });
    });

    return 1;
};

const needsUpdate = (monthDifference, periodicidad, notified, notifiedAt) => {
    return monthDifference >= periodicidad && !notified;
}

const sendEmail = async (nombres, correo, indicadoresNames, indicadoresNamesString, salutation, indicadoresAndExpirationDate) => {

    await sender(
        correo,
        'Indicadores pendientes de actualización 🦂',
        salutation,
        '<h1>nothing to do here</h1>'
    )
}


const splitNameKeepFirstOne = (name) => {
    return name.split(' ')[0];
}

module.exports = checkForUpdates;