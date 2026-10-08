const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^(")(.*)\1$/, '$2').replace(/^(')(.*)\1$/, '$2');
    }
  }
}

async function main() {
  loadLocalEnv();
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!uri) throw new Error('Set MONGODB_URI to the production MongoDB database.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set ADMIN_EMAIL to a valid email address.');
  if (!password || password.length < 12) throw new Error('Set ADMIN_PASSWORD to a password with at least 12 characters.');

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'tripplanner');
    const users = db.collection('users');
    await users.createIndex({ email: 1 }, { unique: true });

    const existing = await users.findOne({ email });
    if (existing) {
      if (existing.role === 'ADMIN') {
        console.log('An administrator with this email already exists; no changes were made.');
        return;
      }
      throw new Error('This email already belongs to a non-admin user. Choose a different ADMIN_EMAIL.');
    }

    const latest = await users.findOne({}, { sort: { id: -1 }, projection: { id: 1 } });
    const counters = db.collection('_counters');
    await counters.updateOne({ _id: 'users' }, { $max: { sequence: latest?.id || 0 } }, { upsert: true });
    const counter = await counters.findOneAndUpdate({ _id: 'users' }, { $inc: { sequence: 1 } }, { returnDocument: 'after' });
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const passwordHash = await bcrypt.hash(password, 12);

    await users.insertOne({
      id: counter.sequence,
      name: process.env.ADMIN_NAME?.trim() || 'TripPlanner Admin',
      email,
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: timestamp,
      updated_at: timestamp,
    });
    console.log(`Created admin account for ${email}. The password was not printed.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Admin setup failed:', error.message);
  process.exitCode = 1;
});
