const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Create transporter using Brevo SMTP
    const transporter = nodemailer.createTransporter({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.BREVO_SMTP_USER, // Your Brevo login email
        pass: process.env.BREVO_SMTP_PASS, // Your Brevo SMTP key
      },
    });

    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`,
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent successfully: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = sendEmail;