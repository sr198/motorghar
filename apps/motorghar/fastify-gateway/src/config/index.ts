import { env } from './env.js';

export const config = {
  env: env.NODE_ENV,
  port: env.PORT_GATEWAY,

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRY,
  },

  admin: {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  },

  services: {
    catalog: `http://localhost:${env.PORT_SVC_CATALOG}`,
    content: `http://localhost:${env.PORT_SVC_CONTENT}`,
    serviceCenter: `http://localhost:${env.PORT_SVC_SERVICE_CENTER}`,
    garage: `http://localhost:${env.PORT_SVC_GARAGE}`,
  },

  logging: {
    level: env.LOG_LEVEL,
  },
};

export { env };