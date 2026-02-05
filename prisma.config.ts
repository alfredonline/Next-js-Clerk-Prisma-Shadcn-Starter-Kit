import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

export default defineConfig({
  datasource: {
    url: process.env.DB_URL || process.env.DATABASE_URL || '',
  },
});
