import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const connectionString = process.env.DATABASE_URL;

console.log('--- GUtech Internal LMS: Automated Database Migrator ---');

const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
const seedFile = path.join(rootDir, 'supabase', 'seed.sql');

const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Discovered ${migrationFiles.length} migration files in supabase/migrations/`);

async function runMigrations() {
  if (!connectionString) {
    console.log('No DATABASE_URL found in backend/.env.');
    printManualInstructions();
    return;
  }

  console.log(`Connecting to PostgreSQL database...`);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL successfully!\n');

    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      console.log(`✓ ${file} applied successfully.`);
    }

    if (fs.existsSync(seedFile)) {
      console.log(`\nApplying seed data: ${path.basename(seedFile)}...`);
      const seedSql = fs.readFileSync(seedFile, 'utf-8');
      await client.query(seedSql);
      console.log(`✓ Seed data applied successfully.`);
    }

    console.log('\n======================================================');
    console.log('🎉 All migrations and seed data applied to Supabase!');
    console.log('======================================================');
  } catch (err) {
    console.warn('\nDirect database connection notice:', err.message);
    printManualInstructions();
  } finally {
    await client.end().catch(() => {});
  }
}

function printManualInstructions() {
  console.log('\n--- Alternative: Supabase Project Dashboard Execution ---');
  console.log('If direct port 5432 is restricted on your network:');
  console.log('1. Go to your Supabase Project Dashboard -> SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/lprpmnorxfhrfwmwkqmh/sql');
  console.log('2. Copy and execute each file from supabase/migrations (0001 to 0006).');
  console.log('3. Copy and execute supabase/seed.sql.');
  console.log('---------------------------------------------------------');
}

runMigrations();
