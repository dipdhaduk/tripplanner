const fs = require('node:fs');
const path = require('node:path');
const { MongoClient } = require('mongodb');

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(\")(.*)\1$/, '$2').replace(/^(')(.*)\1$/, '$2');
  }
}
const shift = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const stamp = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

async function main() {
  loadLocalEnv();
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo database seeding is disabled in production. Use npm run admin:create to create a private admin account.');
  }
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tripplanner';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'tripplanner');
    await Promise.all([
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('trips').createIndex({ user_id: 1, start_date: 1 }),
      db.collection('itineraries').createIndex({ trip_id: 1, day_number: 1, start_time: 1 }),
      db.collection('reviews').createIndex({ status: 1, created_at: -1 }),
      db.collection('contact_messages').createIndex({ status: 1, created_at: -1 }),
    ]);
    const created = {};
    const seed = {
      users: [
        { id: 1, name: 'TripPlanner Admin', email: 'admin@tripplanner.local', password: '$2b$12$uZHqIryjSEnr9ZQkqYNP3O6PJosjSko28q08Knzb22mB7S3MSp7rK', role: 'ADMIN', status: 'ACTIVE', created_at: stamp(), updated_at: stamp() },
        { id: 2, name: 'Maya Chen', email: 'maya@example.com', password: '$2b$12$uZHqIryjSEnr9ZQkqYNP3O6PJosjSko28q08Knzb22mB7S3MSp7rK', role: 'USER', status: 'ACTIVE', created_at: stamp(), updated_at: stamp() },
        { id: 3, name: 'Arjun Mehta', email: 'arjun@example.com', password: '$2b$12$uZHqIryjSEnr9ZQkqYNP3O6PJosjSko28q08Knzb22mB7S3MSp7rK', role: 'USER', status: 'ACTIVE', created_at: stamp(), updated_at: stamp() },
      ],
      trips: [
        { id: 1, user_id: 2, trip_name: 'A royal Rajasthan escape', destination: 'Jaipur & Udaipur', start_date: shift(21), end_date: shift(27), budget: 48000, notes: 'Pack for warm afternoons and cooler evenings. Keep one slow chai stop in every city.', created_at: stamp(), updated_at: stamp() },
        { id: 2, user_id: 2, trip_name: 'Kerala, the slow way', destination: 'Alleppey & Kochi, Kerala', start_date: shift(90), end_date: shift(96), budget: 92000, notes: 'Confirm the houseboat stay and leave room for an unplanned backwater walk.', created_at: stamp(), updated_at: stamp() },
        { id: 3, user_id: 3, trip_name: 'Mountain air in Himachal', destination: 'Shimla & Manali, Himachal Pradesh', start_date: shift(35), end_date: shift(38), budget: 35000, notes: 'Carry a light jacket and check road conditions before the mountain drive.', created_at: stamp(), updated_at: stamp() },
      ],
      itineraries: [
        { id: 1, trip_id: 1, day_number: 1, activity: 'Arrive and settle in', location: 'Jaipur', activity_date: shift(21), start_time: '15:00', end_time: '17:00', notes: 'Drop your bags, then explore the old city at an easy pace.', created_at: stamp() },
        { id: 2, trip_id: 1, day_number: 1, activity: 'Sunset chai and a city view', location: 'Nahargarh Fort, Jaipur', activity_date: shift(21), start_time: '17:30', end_time: '19:00', notes: 'Reach the fort before sunset; carry a light layer.', created_at: stamp() },
        { id: 3, trip_id: 1, day_number: 2, activity: 'Amber Fort and the stepwell', location: 'Amer, Jaipur', activity_date: shift(22), start_time: '08:00', end_time: '12:00', notes: 'Start early to beat the heat and crowds.', created_at: stamp() },
        { id: 4, trip_id: 3, day_number: 1, activity: 'Morning walk in the hills', location: 'Mall Road, Shimla', activity_date: shift(35), start_time: '08:00', end_time: '10:00', notes: 'Take it slow and stop for chai along the way.', created_at: stamp() },
      ],
      reviews: [
        { id: 1, user_id: 2, rating: 5, review_text: 'Planning Jaipur and Udaipur in one place made our Rajasthan trip feel relaxed before it even began. The little chai stops became our favourite memories.', status: 'PUBLISHED', created_at: stamp() },
        { id: 2, user_id: 3, rating: 4, review_text: 'The day-by-day itinerary was easy to follow, and keeping the mountain drive notes with our Himachal trip saved us time.', status: 'PUBLISHED', created_at: stamp() },
      ],
      contact_messages: [
        { id: 1, name: 'Demo traveller', email: 'demo.traveller@example.com', subject: 'A question about planning', message: 'Can I add more than one activity to the same day? I am planning a family trip through Rajasthan.', status: 'NEW', created_at: stamp() },
      ],
    };
    for (const [name, docs] of Object.entries(seed)) {
      const collection = db.collection(name);
      if (await collection.countDocuments() === 0) {
        await collection.insertMany(docs);
        created[name] = docs.length;
      } else created[name] = 0;
      const maxDoc = await collection.findOne({}, { sort: { id: -1 }, projection: { id: 1 } });
      await db.collection('_counters').updateOne({ _id: name }, { $max: { sequence: maxDoc?.id || 0 } }, { upsert: true });
    }
    const counts = {};
    for (const name of Object.keys(seed)) counts[name] = await db.collection(name).countDocuments();
    if (Object.values(counts).some((count) => count === 0)) throw new Error('Database setup verification failed.');
    console.log('MongoDB database is ready:', { created, counts });
  } finally { await client.close(); }
}
main().catch((error) => { console.error('MongoDB setup failed:', error.message); process.exitCode = 1; });
