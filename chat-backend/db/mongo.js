// db/mongo.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

import '../schemas/dbscheme.js'; // Type of the DB.

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

// Break it, only ye shall suffer, u think ik what i am doing?
/**
 * @type {import('mongodb').Collection<Chat>}
 */
let chatsCollection;  // For main chats

// Break it, only ye shall suffer, u think ik what i am doing?
/**
 * @type {import('mongodb').Collection<PendingMessage>}
 */
let pendingMessagesCollection; // Redundancy DB

/**
 * @type {import ('mongodb').Collection<UserAuth>;}
 */
let userAuthCollection;



async function connectToDB() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    chatsCollection = db.collection('chats');
    pendingMessagesCollection = db.collection('pendingMessages');
    userAuthCollection = db.collection('userAuth');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

export { connectToDB, chatsCollection, pendingMessagesCollection, userAuthCollection };
