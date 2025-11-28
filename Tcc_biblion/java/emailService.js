const nodemailer = require("nodemailer");
const dayjs = require("dayjs");
const cron = require("node-cron");

require("dotenv").config();



async function enviarEmail(destinatario, assunto, htmlMensagem) {
    // Configuração fixa do remetente oficial BibliONtec
    const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true, // SSL
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }

    });

    await transporter.sendMail({
        from: '"BibliONtec - Notificações" <sistema@bibliontec.com.br>',
        to: destinatario,
        subject: assunto,
        html: htmlMensagem,
    });

    console.log(`✅ E-mail enviado para ${destinatario}`);
}

module.exports = { enviarEmail };
