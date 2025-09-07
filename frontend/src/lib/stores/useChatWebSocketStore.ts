// useChatWebSocketStore.ts
import { create } from "zustand";
import { createChatWebSocket } from "@/lib/chatServices";
import { useChatStore } from "./useChatStore";
import { useFileStore } from "./useFileStore";
import { useMemoryStore } from "./useMemoryStore";
import { useUIStore } from "./useUIStore";
import toast from 'react-hot-toast';

interface WebSocketState {
  wsMap: Map<string, WebSocket>;
  queue: string[];

  connect: (userId: string, chatId: string) => void;
  disconnect: (chatId: string) => void;
  // setWebSocket: (ws: WebSocket | null) => void;
  sendMessage: (
    userId: string,
    chatId: string,
    messageId: string,
    text: string,
    fileIds: string[],
    memIds: string[]
  ) => void;
}

export const useChatWebSocketStore = create<WebSocketState>((set, get) => ({
  wsMap: new Map(),
  queue: [],

  connect: (userId, chatId) => {
    const { wsMap, queue } = get();
    const { appendChatMessage, updateChatMessage } = useChatStore.getState();
    const { setIsProcessingInput } = useUIStore.getState();

    // Check if WS for this chatId already exists
    if (wsMap.has(chatId)) {
      // console.log(`✅ Already connected to WS for chat: ${chatId}`);
      return;
    }

    // if over limit(3), close + drop oldest
    // console.log(queue);
    if (queue.length >= 3) {
      const oldestWSConnId = queue[0];
      const oldestWs = wsMap.get(oldestWSConnId);
      if (oldestWs) {
        oldestWs.close()
        // console.log("Triggering closing of oldest Conn: ", oldestWSConnId)
        wsMap.delete(oldestWSConnId);
        queue.shift();
      }
    }


    // console.log(`🔗 Creating new WS for chat: ${chatId}`);
    const newWs = createChatWebSocket(userId, chatId);

    // --- Handlers ---
    newWs.onopen = () => {
      console.log("🟢 WS connected");
    };

    newWs.onclose = () => {
      console.log(`⚠️ WS for chat: ${chatId} closed.`);
      // Remove it from the map when it's closed
      set((state) => {
        const newMap = new Map(state.wsMap);
        newMap.delete(chatId);
        return { wsMap: newMap };
      });
    };

    newWs.onerror = async (err) => {
      console.error("❌ WS error", err);
      // Ensure cleanup uses same path as manual disconnect
      get().disconnect(chatId);
    };

    newWs.onmessage = (event) => {
      console.log("📩 WS message raw", event.data);
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "chunk": {
          const aiMsgId = msg.msgId + "_ai_reply";

          if (msg.chunkIdx === 0) {
            setIsProcessingInput(false);
            // console.log("🆕 First chunk, creating AI msg", aiMsgId);
            appendChatMessage({
              msgId: aiMsgId,
              role: "ai",
              content: msg.content,
              timestamp: Date.now(),
            }, chatId);
          } else {
            // console.log("➕ Appending chunk to", aiMsgId);
            updateChatMessage(chatId, aiMsgId, msg.content);
          }
          break;
        }

        case "control": {
          console.log("⚙️ Control signal", msg.signal);
          if (msg.signal === "end") {
            // console.log("✅ Stream ended");
          }
          break;
        }

        case "vectorization_status": {
          if (msg.status === "success") {
            useFileStore.setState((state) => {
              const file = state.chatFiles.get(msg.fileId);
              if (!file) return state;

              const updated = {
                ...file,
                status: msg.status,
                isVectorDBCreated: true,
                error: "",
              };

              const newMap = new Map(state.chatFiles);
              newMap.set(msg.fileId, updated);

              return { chatFiles: newMap };

            })
            toast.success(`${msg.fileName} vectorized successfully`, { duration: 4000 });
          } else if (msg.status === "failed") {
            useFileStore.setState((state) => {
              const file = state.chatFiles.get(msg.fileId);
              if (!file) return state;

              const updated = {
                ...file,
                status: msg.status,
                isVectorDBCreated: false,
                error: msg.error || "File Vectorization failed",
              }
              const newMap = new Map(state.chatFiles);
              newMap.set(msg.fileId, updated);

              return { chatFiles: newMap };
            })
            toast.error(`Failed to vectorize ${msg.fileName}: ${msg.error}`, { duration: 6000 });
          }
          break;
        }

        case "deletion_status": {
          if (msg.status === "deleted") {
            toast.success(`${msg.fileName} deleted successfully`, { duration: 4000 });
          } else if (msg.status === "error") {
            toast.error(`Failed to delete ${msg.fileName}: ${msg.error}`, { duration: 6000 });
          }
          break;
        }


        default:
          console.error("❓ Unknown msg type", msg.type);
      }
    };

    // Save socket
    set({
      wsMap: new Map(wsMap.set(chatId, newWs)),
      queue: [...queue, chatId],
    })

  },

  disconnect: (chatId) => {
    const { wsMap, queue } = get();
    const ws = wsMap.get(chatId);
    if (ws) {
      console.log(`🔌 Disconnecting WS for chat: ${chatId}`);
      ws.close();
      wsMap.delete(chatId);
    }

    set({
      wsMap: new Map(wsMap),
      queue: queue.filter((id) => id !== chatId),
    });
  },

  sendMessage: (userId, chatId, messageId, text, fileIds, memIds) => {
    const { wsMap } = get();
    const ws = wsMap.get(chatId);
    if (ws && ws.readyState === WebSocket.OPEN) {
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

      memIds.forEach(memId =>
        useMemoryStore.getState().removeFromSelectedMemoriesById(memId)
      );

      fileIds.forEach(fileId => {
        const file = useFileStore.getState().selectedFiles.find(f => f.fileId === fileId);
        if (file) {
          useFileStore.getState().removeFromSelectedFiles(file);
        }
      });
      
    } else {
      console.warn("⚠️ Tried to send message while WS is not connected");
    }
  },
}));

