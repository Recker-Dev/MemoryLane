import { chatsCollection } from '../db/mongo.js';

export default async function chatRoutes(fastify, options) {

    // 1. Create new chat
    fastify.post('/createChat/:userId', async (req, res) => {
        const { userId } = req.params;
        const { chatId, name } = req.body;

        // console.log('💬 Body:', req.body); // 👈 this should show your payload
        // console.log('🧾 Params:', req.params);

        if (!chatId || !name)
            return res.status(400).send({ error: 'chatId and name are required' });


        const exists = await chatsCollection.findOne({ chatId });

        if (exists)
            return res.status(400).send({ error: 'Chat already exists' });


        await chatsCollection.insertOne({
            userId,
            chatId,
            name: name,
            messages: [],
            createdAt: new Date()
        })

        return { success: true };
    });


    // 2. Get chat heads for a user
    fastify.get('/chatHeads/:userId', async (req, res) => {
        const { userId } = req.params;

        const chats = await chatsCollection
            .find({ userId })
            .project({ chatId: 1, name: 1, messages: 1 })
            .toArray();

        const heads = chats.map(chat => ({
            chatId: chat.chatId,
            name: chat.name,
            preview: chat.messages?.length > 0
                ? chat.messages[chat.messages.length - 1].text
                : 'No messages yet.'

        }));

        return heads;
    });



    // 3. Get full message history for a chat
    fastify.get('/chats/:userId/:chatId', async (req, res) => {
        const { userId, chatId } = req.params;
        const chat = await chatsCollection.findOne({
            userId, chatId
        });

        return chat?.messages || [];
    });


    // 4. Append a new message
    fastify.post('/chats/:userId/:chatId', async (req, res) => {
        const { userId, chatId } = req.params;
        const { message } = req.body;

        if (!message || typeof message != 'object') {
            return res.status(400).send({ error: 'Invalid Message Format, expected an object' })
        }

        await chatsCollection.updateOne(
            { userId, chatId },
            { $push: { messages: message } },
            { upsert: true }
        );
        return { success: true };
    });


}