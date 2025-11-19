import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  try {
    const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || false;

    const user = process.env.SMTP_USER
      || process.env.BREVO_SMTP_USER
      || process.env.BREVO_SENDER_EMAIL;

    const pass = process.env.SMTP_PASS
      || process.env.BREVO_SMTP_PASS
      || process.env.BREVO_SMTP
      || process.env.BREVO_API_KEY;

    const fromName = process.env.FROM_NAME || process.env.BREVO_SENDER_NAME || 'Dominion Operations System';
    const fromEmail = process.env.FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_USER || user;

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

    const message = {
      from: `${fromName} <${fromEmail}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent successfully: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw error;
  }
};

export default sendEmail;