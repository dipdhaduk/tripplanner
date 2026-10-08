const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local is required for the one-time migration.');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(\")(.*)\1$/, '$2').replace(/^(')(.*)\1$/, '$2');
  }
}

async function main() {
  loadLocalEnv();
  if (!process.env.MONGODB_URI) process.env.MONGODB_URI = 'mongodb://localhost:27017/tripplanner';
  const mysqlClient = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tripplanner', dateStrings: true,
  });
  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  try {
    await mongoClient.connect();
    const db = mongoClient.db(process.env.MONGODB_DB || 'tripplanner');
    const definitions = [
      ['users', 'SELECT id,name,email,password,role,status,created_at,updated_at FROM users'],
      ['trips', 'SELECT id,user_id,trip_name,destination,start_date,end_date,budget,notes,created_at,updated_at FROM trips'],
      ['itineraries', 'SELECT id,trip_id,day_number,activity,location,activity_date,start_time,end_time,notes,created_at FROM itineraries'],
      ['reviews', 'SELECT id,user_id,rating,review_text,status,created_at FROM reviews'],
      ['contact_messages', 'SELECT id,name,email,subject,message,status,created_at FROM contact_messages'],
    ];
    const summary = {};
    for (const [name, sql] of definitions) {
      const [rows] = await mysqlClient.query(sql);
      const docs = rows.map((row) => ({ ...row, id: Number(row.id) }));
      if (name === 'trips') for (const row of docs) row.budget = Number(row.budget || 0);
      if (name === 'itineraries') for (const row of docs) row.day_number = Number(row.day_number);
      if (name === 'reviews') for (const row of docs) row.rating = Number(row.rating);
      if (docs.length) await db.collection(name).bulkWrite(docs.map((doc) => ({ replaceOne: { filter: { id: doc.id }, replacement: doc, upsert: true } })));
      await db.collection('_counters').updateOne({ _id: name }, { $max: { sequence: docs.reduce((max, row) => Math.max(max, row.id), 0) } }, { upsert: true });
      summary[name] = docs.length;
    }
    await Promise.all([
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('trips').createIndex({ user_id: 1, start_date: 1 }),
      db.collection('itineraries').createIndex({ trip_id: 1, day_number: 1, start_time: 1 }),
      db.collection('reviews').createIndex({ status: 1, created_at: -1 }),
      db.collection('contact_messages').createIndex({ status: 1, created_at: -1 }),
    ]);
    console.log('Migrated MySQL rows to MongoDB:', summary);
  } finally {
    await Promise.allSettled([mysqlClient.end(), mongoClient.close()]);
  }
}

main().catch((error) => { console.error('Migration failed:', error.message); process.exitCode = 1; });
