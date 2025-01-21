require('dotenv').config();
const nodemailer = require('nodemailer');

const HOST = process.env.MAIL_HOST;
const PORT = process.env.MAIL_PORT;
const USER = process.env.MAIL_USER;
const PASS = process.env.MAIL_PASS;

const transporter = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    auth: {
        user: USER,
        pass: PASS
    }
})

const sender = async (to, subject, text, html) => {
    const mailOptions = {
        from: USER,
        to,
        subject,
        text,
        html
    }
    try {
        await transporter.sendMail(mailOptions).then(() => {
            console.log('email sent')
        }).catch((err) => {
            console.log(err);
            console.log('there was an error')
        })
    } catch (error) {
        console.log(error);
    }
}

module.exports = sender;