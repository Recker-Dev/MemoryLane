import { chatsCollection, pendingMessagesCollection, userAuthCollection } from '../db/mongo.js';

export default async function chatRoutes(fastify, options) {

    //0. Get Full history for a userID from DB.
    fastify.get('/history/:userId', async (req, res) => {
        const { userId } = req.params;
        if (!userId) return res.code(400).send({ error: 'userId is required' });

        //  Check if userId exist 
        const exists = await chatsCollection.findOne({ userId });


        if (!exists) return res.code(404).send({ error: 'User not found' });

        const history = await chatsCollection
            .find({ userId })
            .project({
                chatId: 1,
                name: 1,
                messages: 1,
                memory: 1,
                createdAt: 1
            })
            .toArray();

        return history;

    });



    // 1. Create new chat
    fastify.post('/createChat/:userId', async (req, res) => {
        const { userId } = req.params;
        const { chatId, name } = req.body;


        if (!chatId || !name)
            return res.code(400).send({ error: 'chatId and name are required' });


        const exists = await chatsCollection.findOne({ chatId });

        if (exists)
            return res.code(400).send({ error: 'Chat already exists' });


        await chatsCollection.insertOne({
            userId,
            chatId,
            name: name,
            messages: [],
            memory: [],
            createdAt: new Date()
        })

        return { success: true };
    });


    // 2. Get chat heads for a user
    fastify.get('/chatHeads/:userId', async (req, res) => {
        const { userId } = req.params;

        if (!userId)
            return res.code(400).send({ error: 'userId is required' });


        const chats = await chatsCollection
            .find({ userId })
            .project({ chatId: 1, name: 1, messages: 1 })
            .toArray();

        const heads = chats.map(chat => ({
            chatId: chat.chatId,
            name: chat.name,
            preview: chat.messages?.length > 0
                ? chat.messages[0].text
                : 'No messages yet.'

        }));

        return heads;
    });



    // 3. Get full message history for a chat
    fastify.get('/chats/:userId/:chatId', async (req, res) => {
        const { userId, chatId } = req.params;
        if (!userId || !chatId)
            return res.code(400).send({ error: 'userId and chatId are required' });

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
            return res.code(400).send({ error: 'Missing messages' });
        }

        if (!Array.isArray(messages)) {
            if (typeof messages === 'object') {
                messages = [messages]; // wrap single message
            } else {
                return res.code(400).send({ error: 'Invalid message format' });
            }
        }

        // Validate all messages
        if (messages.some(msg => typeof msg !== 'object' || !msg.sender || !msg.text)) {
            return res.code(400).send({ error: 'Each message must be an object with sender and text' });
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
            return res.code(400).send({ error: 'Invalid Message Format, expected an object' });

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
            return res.code(400).send({ error: 'Invalid message object' });
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
        if (!userId || !chatId) return res.code(400).send({ error: 'userId and chatId are required' });

        // Check if userId and chatId are even valid
        const exists = await chatsCollection.findOne({ userId: String(userId), chatId });

        if (!exists) return res.code(404).send({ error: 'Chat not found' });

        await chatsCollection.deleteOne({ userId, chatId });

        return { success: true };

    });



    //8. Add Memories for Chat-ids
    fastify.post('/addMemory/:userId/:chatId', async (req, res) => {
        const { userId, chatId } = req.params;
        let { mem_id, context, tags } = req.body;

        if (!userId || !chatId) return res.code(400).send({ error: 'userId and chatId are required' });
        if (!mem_id || !context) return res.code(400).send({ error: 'mem_id, context are required' });

        // Check if chat exists first
        const chat = await chatsCollection.findOne({
            userId,
            chatId
        });

        if (!chat) {
            return res.code(404).send({ error: 'Chat not found. Cannot add memory.' });
        }

        // Check same id memory doesn't exist
        const exists = await chatsCollection.findOne({
            userId,
            chatId,
            'memory.mem_id': mem_id
        });

        if (exists) {
            return res.code(400).send({ error: 'Memory already exists' });
        }

        // If no tags provided, fake an API call and put placeholder tags
        if (!tags || tags.length === 0) {
            // IMPLEMENT TAG GENERATION CODE, call AI model from fastapi.
            tags = ["Placeholder", "Tags"];
        }

        const result = await chatsCollection.updateOne(
            { userId, chatId },
            {
                $push: {
                    memory: {
                        mem_id,
                        context,
                        tags
                    }
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.code(404).send({ error: 'Chat not found. Cannot add memory.' });
        }

        return { success: true };
    });


    //9. Get all memories for a userId, chatId
    fastify.get('/memories/:userId/:chatId', async (req, res) => {
        const { userId, chatId } = req.params;

        if (!userId || !chatId) return res.code(400).send({ error: 'userId, chatId and mem_id are required' });

        // Grab memories if any there or else return empty array
        const memories = await chatsCollection.findOne({
            userId,
            chatId
        }, {
            projection: {
                memory: 1
            }
        });

        return memories?.memory || [];

    });


    //10. Delete a memory for given chatId and userId
    fastify.delete('/delMemory/:userId/:chatId/:mem_id', async (req, res) => {
        const { userId, chatId, mem_id } = req.params;

        if (!userId || !chatId || !mem_id) return res.code(400).send({ error: 'userId, chatId and mem_id are required' });

        // Check if memory exists
        const exists = await chatsCollection.findOne({
            userId,
            chatId,
            'memory.mem_id': mem_id
        });

        if (!exists) return res.code(404).send({ error: 'Memory or chat or user not found.' });

        // Delete memory
        await chatsCollection.updateOne(
            { userId, chatId },
            {
                $pull: {
                    memory: { mem_id }
                }
            }
        );

        return { success: true };
    });


    //11. Method to enter user data in DB
    fastify.post('/registerUser', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.code(400).send({ error: 'Email and password required' });
        }

        // Check if email is present in the db.
        const exists = await userAuthCollection.findOne({ email: email.toLowerCase() });

        if (exists) return res.code(400).send({ error: 'User Email already exists' });

        // Enter user email and password in db.
        await userAuthCollection.insertOne({
            email: email.toLowerCase(),
            password
        });

        return { success: true };

    });

    //12. Method to check if user data in DB
    fastify.post('/validateUser', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.code(400).send({ error: 'Email and password required' });
        }

        // Check if user data exists
        const user = await userAuthCollection.findOne({ email: email.toLowerCase(), password });

        if (!user) return res.code(400).send({ error: 'User not in DB' });

        return {
            success: true,
            userId: user._id.toString(),
            email: user.email
        }
    })

}
