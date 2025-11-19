import Joi from 'joi';
import dotenv from 'dotenv';

// Load .env only once here (server.js also loads but double load is harmless)
dotenv.config();

// Define validation schema for required environment variables
const uriValidator = Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] });
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development','test','staging','production').default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(5000),
  MONGODB_URI: uriValidator.optional(),
  MONGO_URI: uriValidator.optional(),
  JWT_SECRET: Joi.string().min(24).required(),
  JWT_EXPIRES_IN: Joi.string().default('30d'),
  CLIENT_URL: Joi.string().uri().default('http://localhost:3000'),
  API_PREFIX: Joi.string().pattern(/^\/api\/(v\d+)$/).default('/api/v1'),
  APP_VERSION: Joi.string().default('1.0.0'),
  // Legacy Brevo vars
  BREVO_SMTP_USER: Joi.string().email().optional(),
  BREVO_SMTP_PASS: Joi.string().optional(),
  // New Brevo naming variants
  BREVO_SENDER_EMAIL: Joi.string().email().optional(),
  BREVO_SENDER_NAME: Joi.string().optional(),
  BREVO_SMTP: Joi.string().optional(), // may hold SMTP password/key
  BREVO_API_KEY: Joi.string().optional(),
  FROM_NAME: Joi.string().default('Dominion Operations System'),
  FROM_EMAIL: Joi.string().email().optional(),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().integer().optional(),
  SMTP_EMAIL: Joi.string().email().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  EDIT_CUTOFF_HOUR: Joi.number().integer().min(0).max(23).default(20) // daily edit cutoff (8pm)
}).unknown(); // allow extra vars

const { value: env, error } = envSchema.validate(process.env, { abortEarly: false });
if (error) {
  const details = error.details.map(d => d.message).join('; ');
  console.error('\n[CONFIG] Environment validation failed (pre uri fallback):\n', details, '\n');
  throw new Error('Invalid environment configuration');
}

// Fallback handling for Mongo URI names
if (!env.MONGODB_URI && env.MONGO_URI) {
  env.MONGODB_URI = env.MONGO_URI; // normalize
}
if (!env.MONGODB_URI) {
  console.error('[CONFIG] MONGODB_URI (or MONGO_URI) not set in environment');
  throw new Error('Missing MongoDB connection URI');
}

// Support ${VAR} interpolation inside MONGODB_URI (dotenv does not expand by default)
const interpolate = (value, sourceEnv) => {
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{([^}]+)\}/g, (_, name) => sourceEnv[name] || ``);
};
env.MONGODB_URI = interpolate(env.MONGODB_URI, env);

// Derived / structured configuration object
export const config = {
  env: env.NODE_ENV,
  server: {
    port: env.PORT,
    version: env.APP_VERSION,
    apiPrefix: env.API_PREFIX,
    editCutoffHour: env.EDIT_CUTOFF_HOUR // used to restrict BR edits after submission window
  },
  db: { uri: env.MONGODB_URI },
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN
  },
  client: {
    url: env.CLIENT_URL
  },
  email: {
    brevoUser: env.BREVO_SMTP_USER || env.BREVO_SENDER_EMAIL,
    brevoPass: env.BREVO_SMTP_PASS || env.BREVO_SMTP || env.BREVO_API_KEY,
    fromName: env.FROM_NAME || env.BREVO_SENDER_NAME || 'Dominion Operations System',
    fromEmail: env.FROM_EMAIL || env.BREVO_SENDER_EMAIL || env.BREVO_SMTP_USER,
    smtpHost: env.SMTP_HOST,
    smtpPort: env.SMTP_PORT,
    smtpEmail: env.SMTP_EMAIL,
    smtpPassword: env.SMTP_PASSWORD
  }
};

export default config;
