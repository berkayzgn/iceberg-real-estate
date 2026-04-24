import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3002', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-in-production',
  jwtExpiresSeconds: process.env.JWT_EXPIRES_SECONDS ?? '604800',
  adminEmail: (process.env.ADMIN_EMAIL ?? 'admin@icebergdigital.com').toLowerCase().trim(),
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin1234',
}));
