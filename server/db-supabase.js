import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Construct the URL if only ID is provided, or use full URL
const projectUrl = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('http')
    ? `https://${process.env.SUPABASE_URL}.supabase.co`
    : process.env.SUPABASE_URL;

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!projectUrl || !serviceKey) {
    if (IS_PRODUCTION) {
        console.error('FATAL: Supabase credentials missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Exiting.');
        process.exit(1);
    } else {
        console.warn('⚠️ WARNING: Supabase credentials missing in .env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    }
} else {
    console.log('✅ Supabase initialized.');
}

// Create Supabase client (SERVICE_ROLE_KEY for server-side admin access, bypasses RLS)
export const supabase = createClient(
    projectUrl || 'https://placeholder.supabase.co',
    serviceKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
