import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Wait for dotenv to load or assure process.env.DATABASE_URL
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
