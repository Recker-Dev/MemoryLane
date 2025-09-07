/* eslint-disable */
import { type MessageBubbleProps } from '@/components/ui/MessageBubble';
import { type Memory } from '@/components/widgets/ChatMemoriesDropdown';


export async function fetchChatHeadsApiHelper(userId: string): Promise<any> {
    const response = await fetch(`http://localhost:8080/chatHeads/${userId}`,
        { method: "GET" }
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }

    const data = await response.json();
    return data;
}

export async function fetchChatHistoryApiHelper(userId: string, chatId: string): Promise<any> {
    console.log("APPPPPPPPIIIIIIIIIIII BOIIIIIIIII")
    const response = await fetch(`http://localhost:8080/chats/${userId}/${chatId}`);
    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }

    const data = await response.json()
    return data;
}

export async function getAiResponse(userId: string, chatId: string, text: string, selected_memories: Memory[]): Promise<
    { success: true, message: MessageBubbleProps } |
    { success: false, message: string }> {

    const response = await fetch(`http://localhost:3001/ai/${userId}/${chatId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: { text: text, selected_memories: selected_memories } }),
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


export async function createNewChatApiHelper(userId: string, chatName: string): Promise<any> {

    const response = await fetch(`http://localhost:8080/createChat/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: chatName }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }

    const data = await response.json();
    return data;

}


export async function deleteChatApiHelper(userId: string, chatId: string): Promise<any> {

    const response = await fetch(`http://localhost:8080/deleteChat/${userId}/${chatId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }

    const data = await response.json();
    return data;

}


export async function addChatMemoryApiHelper(userId: string, chatId: string, memoryContext: string): Promise<any> {

    const response = await fetch(`http://localhost:8080/addMemory/${userId}/${chatId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context: memoryContext }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }

    const data = await response.json();
    return data;

}

export async function getMemoriesApiHelper(userId: string, chatId: string): Promise<any> {

    const response = await fetch(`http://localhost:8080/memories/${userId}/${chatId}`);

    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }

    const data = await response.json();
    return data;

}


export async function toggleMemoryPersistanceApiHelper(userId: string, chatId: string, memId: string, setVal: boolean): Promise<any> {
    const response = await fetch(`http://localhost:8080/setMemoryPersist/${userId}/${chatId}/${memId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ persist: setVal }),


    });
    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }
    const data = await response.json();
    return data;
}

export async function deleteMemoryApiHelper(userId: string, chatId: string, memoryId: string): Promise<any> {

    const response = await fetch(`http://localhost:8080/deleteMemory/${userId}/${chatId}/${memoryId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }
    const data = await response.json();
    return data;

}

export async function addChatFileApiHelper(userId: string, chatId: string, files: File[]): Promise<any> {
    const formData = new FormData();

    // append multiple files under key "files"
    files.forEach((file) => { formData.append("files", file); });

    const response = await fetch(`http://localhost:8080/uploadFiles/${userId}/${chatId}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }
    const data = await response.json();
    return data;

}

export async function getChatFilesApiHelper(userId: string, chatId: string): Promise<any> {
    const response = await fetch(`http://localhost:8080/getFilesData/${userId}/${chatId}`);

    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }

    const data = await response.json();
    return data;
}

export async function deleteChatFilesApiHelper(userId: string, chatId: string, fileIds: string[]): Promise<any> {
    const response = await fetch(`http://localhost:8080/deleteFiles/${userId}/${chatId}`, {
        method: 'DELETE',
        body: JSON.stringify({ file_ids: fileIds }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        return errorData;
    }

    const data = await response.json();
    return data;
}

export async function toggleFilePersistanceApiHelper(userId: string, chatId: string, fileId: string, setVal: boolean): Promise<any> {
    const response = await fetch(`http://localhost:8080/setFilePersist/${userId}/${chatId}/${fileId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ persist: setVal }),


    });
    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        return errorData;
    }
    const data = await response.json();
    return data;
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

    if (!response.ok) {
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


export function createChatWebSocket(userId: string, chatId: string,) {
    const ws = new WebSocket(`ws://localhost:8082/ws?userId=${userId}&chatId=${chatId}`);
    ws.binaryType = "arraybuffer"

    const sendJson = (msg: any) => {
        if (ws.readyState == WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
        }
    };

    return ws;
}

export async function sendChatMessage(ws: WebSocket,
    userId: string,
    chatId: string,
    messageId: string,
    text: string,
    fileIds: string[] = [],
    memIds: string[] = [],
) {

    const payload = {
        msgId: messageId,
        chatId: chatId,
        userId: userId,
        role: "user",
        content: text,
        fileIds: fileIds,
        memIds: memIds,
        timestamp: new Date().toISOString(), // frontend timestamp
    };

    ws.send(JSON.stringify(payload));
}