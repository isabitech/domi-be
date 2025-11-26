import nodemailer from 'nodemailer';

let cachedTransporter = null;
let cachedSignature = null;

const buildTransportConfig = () => {
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

  return { host, port, secure, user, pass };
};

const getTransporter = () => {
  const config = buildTransportConfig();
  const signature = `${config.host}|${config.port}|${config.secure}|${config.user}|${config.pass}`;

  if (!cachedTransporter || cachedSignature !== signature) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass }
    });
    cachedSignature = signature;
  }

  return cachedTransporter;
};

const buildDefaults = () => ({
  fromName: process.env.FROM_NAME || process.env.BREVO_SENDER_NAME || 'Dominion Operations System',
  fromEmail: process.env.FROM_EMAIL
    || process.env.BREVO_SENDER_EMAIL
    || process.env.BREVO_SMTP_USER
    || process.env.SMTP_USER
});

const formatMessage = (options, defaults) => ({
  from: `${defaults.fromName} <${defaults.fromEmail}>`,
  to: options.email,
  subject: options.subject,
  text: options.message,
  html: options.html || `<p>${options.message}</p>`
});

const sendEmail = async (options) => {
  const defaults = buildDefaults();

  try {
    const transporter = getTransporter();
    const message = formatMessage(options, defaults);
    const info = await transporter.sendMail(message);
    console.log('Email sent successfully: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    cachedTransporter = null;
    cachedSignature = null;
    throw error;
  }
};

export default sendEmail;