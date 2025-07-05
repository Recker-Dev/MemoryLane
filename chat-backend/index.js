import Fastify from 'fastify';
import cors from '@fastify/cors';
import chatRoutes from './routes/chatRoutes.js';
import { connectToDB } from './db/mongo.js';
import { flushPendingMessagesToChats } from './cron.js';

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // ✅ Add all methods to be used!
});

// ✅ Add this for JSON parsing
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    done(err, undefined);
  }
});

await connectToDB();
fastify.register(chatRoutes);

// SETUP Cron Job here
setInterval(async () => {
  try {
    await flushPendingMessagesToChats();
  } catch (err) {
    console.error('❌ Cron sync failed:', err);
  }
}, 10000); // every 10s

fastify.listen({ port: 3001 }, (err, address) => {
  if (err) throw err;
  console.log(`🚀 Server running at ${address}`);
});
