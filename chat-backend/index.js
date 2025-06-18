import Fastify from 'fastify';
import cors from '@fastify/cors';
import chatRoutes from './routes/chatRoutes.js';
import { connectToDB } from './db/mongo.js';

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: 'http://localhost:3000',
  credentials: true
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

fastify.listen({ port: 3001 }, (err, address) => {
  if (err) throw err;
  console.log(`🚀 Server running at ${address}`);
});
