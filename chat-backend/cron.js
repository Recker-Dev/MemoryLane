import { pendingMessagesCollection, chatsCollection } from "./db/mongo.js";

export async function flushPendingMessagesToChats() {
    // Find all pending messages
    const pendingMessages = await pendingMessagesCollection.find({}).toArray();

    if (pendingMessages.length === 0) {
        console.log("No pending messages to flush."); // Optional: log when no messages
        return;
    }

    // Group messages by userId and chatId
    const grouped = new Map();
    for (const msg of pendingMessages) { // Correctly iterate over values
        const key = `${msg.userId}_${msg.chatId}`;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key).push(msg);
    }

    let syncedCount = 0;
    const successfullySyncedIds = []; // To store _id of messages successfully moved

    // Process each group
    for (const [key, messages] of grouped.entries()) {
        const [userId, chatId] = key.split('_');

        // Prepare messages for insertion into the main chat document
        const messagesToInsert = messages.map((msg) => ({
            id: msg.id, // Assuming msg.id exists from pushToPendingMessages
            text: msg.text,
            sender: msg.sender,
            // Add other properties if MessageBubbleProps has them (e.g., timestamp)
        }));

        try {
            // Use $push with $each to append all messages
            const result = await chatsCollection.updateOne(
                { userId, chatId },
                { $push: { messages: { $each: messagesToInsert } } },
                { upsert: true } // Create chat if it doesn't exist
            );

            // If update was successful, mark these pending messages for deletion
            if (result.modifiedCount > 0 || result.upsertedId) {
                syncedCount += messages.length;
                messages.forEach(msg => successfullySyncedIds.push(msg._id)); // Collect MongoDB _id
            }
        } catch (error) {
            console.error(`Error syncing messages for chat ${chatId}:`, error);
            // Do not add these messages to successfullySyncedIds, so they remain in pending
        }
    }

    // Delete only the messages that were successfully moved
    if (successfullySyncedIds.length > 0) {
        await pendingMessagesCollection.deleteMany({ _id: { $in: successfullySyncedIds } });
    }

    if (syncedCount > 0) {
        console.log(`✅ Synced ${syncedCount} pending messages.`);
    } else {
        // console.log("No new pending messages were successfully synced."); // Optional: log when no new sync
    }
}