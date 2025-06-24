import { chatsCollection, pendingMessagesCollection } from '../db/mongo.js';

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

        if (!userId)
            return res.status(400).send({ error: 'userId is required' });


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
        if (!userId || !chatId)
            return res.status(400).send({ error: 'userId and chatId are required' });

        const chat = await chatsCollection.findOne({
            userId, chatId
        });

        if (!chat) {
            return res.code(404).send({ error: 'Chat not found' });
        }

        return chat?.messages || [];
    });


    // 4. Append a new message or messages
    fastify.post('/chats/:userId/:chatId', async (req, res) => {
        const { userId, chatId } = req.params;
        let { messages } = req.body;

        // Normalize input: wrap single message object into array
        if (!messages) {
            return res.status(400).send({ error: 'Missing messages' });
        }

        if (!Array.isArray(messages)) {
            if (typeof messages === 'object') {
                messages = [messages]; // wrap single message
            } else {
                return res.status(400).send({ error: 'Invalid message format' });
            }
        }

        // Validate all messages
        if (messages.some(msg => typeof msg !== 'object' || !msg.sender || !msg.text)) {
            return res.status(400).send({ error: 'Each message must be an object with sender and text' });
        }

        // Update DB
        await chatsCollection.updateOne(
            { userId, chatId },
            {
                $push: {
                    messages: { $each: messages }
                }
            },
            { upsert: true }
        );

        return { success: true };
    });



    // 5. Send AI response to chat from User
    fastify.post('/ai/:userId/:chatId', async (req, res) => {
        const { userId, chatId } = req.params;
        const { message } = req.body;

        if (!message || typeof message != 'object') {
            return res.status(400).send({ error: 'Invalid Message Format, expected an object' });

        }

        // Placeholder AI response
        return {
            text: `This is AI response to |${message.text}| for chatID: |${chatId}| `,
            sender: "ai",
        };

    });


    // 6. Pending Messages DB, setup an API endpoint to store pending messages
    fastify.post('/pending/:userId/:chatId', async (req, res) => {
        const { userId, chatId } = req.params;
        const { message } = req.body;

        if (!message || typeof message !== 'object' || !message.text || !message.sender) {
            return res.status(400).send({ error: 'Invalid message object' });
        }

        await pendingMessagesCollection.insertOne({
            userId,
            chatId,
            id: message.id,
            text: message.text,
            sender: message.sender,
            timestamp: new Date()
        });

        return { success: true };
    });


    //7. Remove Chat-Heads from DB
    fastify.delete('/delChatHead/:userId/:chatId', async (req, res) => {
        const { userId, chatId } = req.params;
        if (!userId || !chatId) return res.status(400).send({ error: 'userId and chatId are required' });

        // Check if userId and chatId are even valid
        const exists = await chatsCollection.findOne({ userId: String(userId), chatId });

        if (!exists) return res.status(404).send({ error: 'Chat not found' });

        await chatsCollection.deleteOne({ userId, chatId });

        return { success: true };

    });




}
