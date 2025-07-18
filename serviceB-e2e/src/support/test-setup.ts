import axios from 'axios';
import { config } from 'dotenv';
import { resolve } from 'path';

module.exports = async function() {
  // Load test environment variables
  config({ path: resolve(__dirname, '../../../../.env.test') });
  config({ path: resolve(__dirname, '../../../../.env.local') });
  config({ path: resolve(__dirname, '../../../../.env') });

  // Configure axios for tests to use.
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3002';
  axios.defaults.baseURL = `http://${host}:${port}`;
};
