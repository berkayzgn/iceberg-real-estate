import { registerAs } from '@nestjs/config';

/**
 * MongoDB connection string (Atlas veya yerel).
 * @see https://www.mongodb.com/docs/atlas/getting-started/
 */
export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI?.trim() ?? '',
}));
