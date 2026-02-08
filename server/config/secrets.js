import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ===== JWT Secret =====
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    if (IS_PRODUCTION) {
        console.error('FATAL: JWT_SECRET is required in production!');
        process.exit(1);
    }
    console.warn('WARNING: JWT_SECRET not set. Using insecure dev fallback.');
    JWT_SECRET = 'dev-insecure-secret-placeholder';
}

// ===== Required env vars validation =====
const REQUIRED_PRODUCTION_VARS = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
if (IS_PRODUCTION) {
    for (const key of REQUIRED_PRODUCTION_VARS) {
        if (!process.env[key]) {
            console.error(`FATAL: Missing required env var: ${key}`);
            process.exit(1);
        }
    }
}

export { JWT_SECRET };
