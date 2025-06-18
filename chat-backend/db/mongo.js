// db/mongo.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

let chatsCollection;

async function connectToDB() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    chatsCollection = db.collection('chats');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

export { connectToDB, chatsCollection };
