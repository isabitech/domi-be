import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { pathToFileURL } from 'url';
import connectDB from '../config/db.js';

dotenv.config();

const MIGRATIONS_DIR = path.resolve('./src/migrations');
const MIGRATIONS_COLLECTION = 'migrations';

async function loadApplied() {
  const col = mongoose.connection.collection(MIGRATIONS_COLLECTION);
  const rows = await col.find({}).toArray();
  return new Set(rows.map(r => r.name));
}

async function markApplied(name) {
  const col = mongoose.connection.collection(MIGRATIONS_COLLECTION);
  await col.insertOne({ name, appliedAt: new Date() });
}

async function main() {
  await connectDB();
  console.log('Running migrations...');
  const applied = await loadApplied();
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d+.*\.js$/.test(f))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skip ${file} (already applied)`);
      continue;
    }
    console.log(`Apply ${file}`);
    const filePath = path.join(MIGRATIONS_DIR, file);
    const mod = await import(pathToFileURL(filePath).href);
    if (typeof mod.default !== 'function') {
      console.log(`Migration ${file} missing default export function`);
      continue;
    }
    await mod.default(mongoose);
    await markApplied(file);
    console.log(`Applied ${file}`);
  }
  console.log('Migrations complete');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration run failed', err);
  process.exit(1);
});
