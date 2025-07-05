import { type ChatHead } from '@/components/widgets/Sidebar';
import { type MessageBubbleProps } from '@/components/ui/MessageBubble';
import { type Memory } from '@/components/widgets/ChatMemoriesDropdown';


export async function fetchChatHeads(userId: string): Promise<{ success: boolean, message: string | ChatHead[] }> {
    console.log("✅ Fetching ChatHeads for userId:", userId);
    const response = await fetch(`http://localhost:3001/chatHeads/${userId}`);

    if (!response.ok) {
        console.error("❌ Failed to fetch chat heads: ", response);
        return {
            success: false,
            message: await response.text()
        };
    }

    // Handle success case
    const data = await response.json();
    return {
        success: true,
        message: data
    };
}

export async function fetchMessages(userId: string, chatId: string): Promise<{ success: boolean, message: string | MessageBubbleProps[] }> {
    const response = await fetch(`http://localhost:3001/chats/${userId}/${chatId}`);
    console.log("✅ Fetching ChatHistory for userId:", userId, "and chatId:", chatId);
    if (!response.ok) {
        console.error("❌ Failed to fetch chat history: ", response);
        return {
            success: false,
            message: await response.text()
        };
    }

    // Handle a sucess
    const data = await response.json()
    return {
        success: true,
        message: data
    };
}

export async function getAiResponse(userId: string, chatId: string, text: string): Promise<
    { success: true, message: MessageBubbleProps } |
    { success: false, message: string }> {

    const response = await fetch(`http://localhost:3001/ai/${userId}/${chatId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: { text: text } }),
    });

    if (!response.ok) {
        console.error("❌ Failed to fetch AI response:", response);
        return {
            success: false,
            message: await response.text()
        };
    }

    const data: MessageBubbleProps = await response.json();
    console.log("✅ AI Response:", data);
    return {
        success: true,
        message: data
    };

}


export async function pushToPendingMessages(userId: string, chatId: string, message: MessageBubbleProps): Promise<{ success: boolean, message: string }> {

    const response = await fetch(`http://localhost:3001/pending/${userId}/${chatId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message }),
    });

    if (!response.ok) {
        console.error("❌ Failed to push to pending messages:", response);
        return {
            success: false,
            message: await response.text()
        };

    }

    console.log("✅ Message Pushed to Pending Messages Collection");
    return {
        success: true,
        message: "Message Pushed to Pending Messages Collection"
    };

}

// export async function updatePendingMessages(userId: string, chatId: string, pendingMessages: MessageBubbleProps[]): Promise<{ success: boolean, message: string }> {
//     if (!pendingMessages || pendingMessages.length === 0) {
//         console.log("❌ No pending messages to update");

//         return {
//             success: true,
//             message: "No pending messages to update"
//         };
//     }

//     const response = await fetch(`http://localhost:3001/chats/${userId}/${chatId}`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ messages: pendingMessages }),
//     });

//     if (!response.ok) {
//         console.error("❌ Failed to update pending messages:", response);
//         return {
//             success: false,
//             message: await response.text()
//         };
//     }

//     console.log("✅ Pending Messages Updated");
//     return {
//         success: true,
//         message: "Pending Messages Updated"
//     };
// }

export async function createNewChatHeadAPI(userId: string, chatHead: ChatHead): Promise<{ success: boolean, message: string }> {

    const response = await fetch(`http://localhost:3001/createChat/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: chatHead.chatId, name: chatHead.name }),
    });

    if (!response.ok) {
        console.error("❌ Failed to create new chat head:", response);
        return {
            success: false,
            message: await response.text()
        };

    }

    console.log("✅ New Chat Head Created");
    return {
        success: true,
        message: "New Chat Head Created"
    };

}


export async function deleteChatHeadAPI(userId: string, chatId: string): Promise<{ success: boolean, message: string }> {

    const response = await fetch(`http://localhost:3001/delChatHead/${userId}/${chatId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        console.error("❌ Failed to delete chat head");
        return {
            success: false,
            message: await response.text()
        };
    }

    console.log("✅ Chat Head Deleted");
    return {
        success: true,
        message: "Chat Head Deleted"
    };

}


export async function addMemory(userId: string, chatId: string, memory: Memory): Promise<{ success: boolean, message: string }> {

    const response = await fetch(`http://localhost:3001/addMemory/${userId}/${chatId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mem_id: memory.mem_id, context: memory.context, tags: memory.tags }),
    });

    if (!response.ok) {
        console.error("❌ Failed to add memory");
        return {
            success: false,
            message: await response.text()
        };
    }

    console.log("✅ Memory Added");
    return {
        success: true,
        message: "Memory Added"
    };

}

export async function getMemories(userId: string, chatId: string): Promise<{ success: boolean, message: string | Memory[] }> {

    const response = await fetch(`http://localhost:3001/memories/${userId}/${chatId}`);

    if (!response.ok) {
        console.error("❌ Failed to fetch memories");
        return {
            success: false,
            message: await response.text()
        };
    }

    console.log("✅ Memories Fetched");
    return {
        success: true,
        message: await response.json()
    };

}


export async function deleteMemory(userId: string, chatId: string, memoryId: string): Promise<{ success: boolean, message: string }> {

    const response = await fetch(`http://localhost:3001/delMemory/${userId}/${chatId}/${memoryId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        console.error("❌ Failed to delete memory");
        return {
            success: false,
            message: await response.text()
        };
    }


    console.log("✅ Memory Deleted");
    return {
        success: true,
        message: "Memory Deleted"
    };

}

export async function fetchRelevantMemories(userId: string, chatId: string, mem_ids: string, tags: string, current_context: string): Promise<{ success: boolean, message: string | Memory[] }> {

    const response = await fetch(`http://localhost:3000/fetchMemories/${userId}/${chatId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mem_ids: mem_ids,
                tags: tags,
                current_context: current_context
            }),
        });

    if(!response.ok)
    {
        console.error("❌ Failed to fetch relevant memories");
        return {
            success: false,
            message: await response.text()
        }
    }

    console.log("✅ Fetched Relevant Memories");
    return {
        success: true,
        message: await response.json()
    }

}
