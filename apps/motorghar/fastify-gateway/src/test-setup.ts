import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test for testing
config({ path: resolve(__dirname, '../.env.test') });
