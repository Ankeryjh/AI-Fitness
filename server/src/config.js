const path = require('path');
const dotenv = require('dotenv');

dotenv.config({path: path.resolve(process.cwd(), '.env')});
dotenv.config({path: path.resolve(__dirname, '../.env')});

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
};

const assertDatabaseConfig = () => {
  if (!env.databaseUrl) {
    throw new Error('Missing environment variable: DATABASE_URL');
  }
};

const assertServerConfig = () => {
  const missing = [];
  if (!env.databaseUrl) {
    missing.push('DATABASE_URL');
  }
  if (!env.jwtSecret) {
    missing.push('JWT_SECRET');
  }
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

module.exports = {
  env,
  assertDatabaseConfig,
  assertServerConfig,
};
