import { MongoClient } from 'mongodb';

let clientPromise;

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing database configuration: MONGODB_URI');
  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect().catch((error) => { clientPromise = undefined; throw error; });
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'tripplanner');
}

export async function nextId(collectionName) {
  const db = await getDb();
  const collection = db.collection(collectionName);
  const maxDoc = await collection.findOne({}, { sort: { id: -1 }, projection: { id: 1 } });
  const counters = db.collection('_counters');
  await counters.updateOne({ _id: collectionName }, { $max: { sequence: maxDoc?.id || 0 } }, { upsert: true });
  const counter = await counters.findOneAndUpdate({ _id: collectionName }, { $inc: { sequence: 1 } }, { returnDocument: 'after' });
  return counter.sequence;
}

export function cleanDocument(document) {
  if (!document) return document;
  const { _id, ...publicDocument } = document;
  return publicDocument;
}

export function now() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }

export async function ensureIndexes(db) {
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('trips').createIndex({ user_id: 1, start_date: 1 }),
    db.collection('itineraries').createIndex({ trip_id: 1, day_number: 1, start_time: 1 }),
    db.collection('reviews').createIndex({ status: 1, created_at: -1 }),
    db.collection('contact_messages').createIndex({ status: 1, created_at: -1 }),
  ]);
}
