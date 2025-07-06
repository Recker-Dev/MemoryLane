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

        const userText = message.text;
        const selected_memories = message.selected_memories;

        let contexts;

        if (!selected_memories.length > 0)
            contexts = "";
        else {
            contexts = selected_memories.map(({ context, tags }) => `context: ${context}, tags: ${tags}`).join('; ');
        }


        if (!message || typeof message != 'object') {
            return res.code(400).send({ error: 'Invalid Message Format, expected an object' });

        }

        // Placeholder AI response
        return {
            text: `This is AI response to |${userText}| with context |${contexts}| for chatID: |${chatId}| `,
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

    //11. Method to fetch relevant memories
    fastify.post('/fetchMemories/:userId/:chatId', async (req, res) => {
        const { userId, chatId } = req.params;
        let { mem_ids, tags, current_context } = req.body;

        if (!userId || !chatId) return res.code(400).send({ error: 'userId and chatId are required' });

        // Load of memories for this chatId and userId
        const chats = await chatsCollection.findOne(
            { userId, chatId },
            { projection: { memory: 1 } }
        );

        if (!chats) return res.code(404).send({ error: 'Chat not found' });

        let memories = chats.memory || [];

        let memories_from_id = [];
        let memories_from_tags = [];
        let memories_from_context = [];


        // Filter Mems by mem_id
        if (mem_ids) {
            const ids_from_string = mem_ids.split(",").map(id => id.trim());
            memories_from_id = memories.filter(m => ids_from_string.includes(m.mem_id));
        }

        // FIlter Mems by tags
        if (tags) {
            const tags_from_string = tags.split(",").map(tag => tag.trim());
            memories_from_tags = memories.filter(m => m.tags.some(t => tags_from_string.includes(t)));
        }

        // Filet Mems by context
        if (current_context) {
            // PLACEHOLDER CODE FOR SIMILARTIY SCORE CHECK IN FUTURE.
            memories_from_context = []
        }

        // Combine the memories and eliminate duplicate entries
        const shortlisted_memories = [
            ...new Map( // External Spread cuz Map returns an iterator and we want array.
                [
                    ...memories_from_id,
                    ...memories_from_tags,
                    ...memories_from_context
                ].map(m => [m.mem_id, m]) // Tuples of tpye [id,memory]
            ).values() // As id of Map cannot be duplicate, we get the intial one and .values gives us back the memory and not id.
        ];

        if (shortlisted_memories.length === 0) {
            return res.code(200).send(
                {
                    success: true,
                    memories: [],
                    message: "No matching memories found. Proceeding without memory context."
                }
            )
        }

        return res.code(200).send(
            {
                success: true,
                memories: shortlisted_memories,
                message: `Found ${shortlisted_memories.length} memories matching your criteria.`
            }
        )

    });


    //12. Method to enter user data in DB
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

    //13. Method to check if user data in DB
    fastify.post('/validateUser', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.code(400).send({ error: 'Email and password required' });
        }


        // Check if user email exists
        const user = await userAuthCollection.findOne({ email: email.toLowerCase() });

        if (!user) return res.code(400).send({ error: 'User not in DB' });

        // Check if passwords match
        if (user.password != password) {
            return res.code(400).send({ error: 'Incorrect Password' });
        }

        res.code(200).send({
            success: true,
            userId: user._id.toString(),
            email: user.email
        });
    })

}
