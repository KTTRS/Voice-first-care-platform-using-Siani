import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

const rootEnvPath = path.resolve(__dirname, '../../../.env');
if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

const packageEnvPath = path.resolve(__dirname, '../../.env');
if (existsSync(packageEnvPath)) {
  dotenv.config({ path: packageEnvPath });
}
