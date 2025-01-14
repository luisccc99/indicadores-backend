const nodemailer = require('nodemailer');
const fs = require("fs");
const templateHtml = fs.readFileSync("./src/templates/email.html", "utf8");
const handlebars = require('handlebars');
const logger = require('../config/logger');

const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async (user, text) => {
    const recoverURL = `http://localhost:3500/recuperacion-de-cuenta/${text}`;
    const nombres = user.nombres;
    const todaysDate = new Date().getFullYear();
    const template = handlebars.compile(templateHtml);
    const html = template({ nombres, recoverURL, todaysDate, allowProtoPropertiesByDefault: true });
    const plainText = `¿No puede visualizar el contenido? Visite el siguiente hipervinculo para reiniciar la contraseña: ${recoverURL}`;
    
    try {
        await transport.sendMail({
            from: '"John Doe 👻"',
            to: user.correo,
            subject: 'Recuperación de contraseña',
            text: plainText,
            html,
            attachments: [{
                filename: 'logo.jpg',
                path: './src/templates/logo.jpg',
                cid: 'cid:logo',
            }],
            date: new Date(),
        });
    } catch (err) {
        logger.error(err);
        throw new Error(`Hubo un problema al enviar el correo: ${err.message}`)
    }
};

module.exports = { sendEmail };
