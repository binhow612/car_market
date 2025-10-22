import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth";

export interface SocketMessage {
  conversationId: string;
  message: {
    id: string;
    content: string;
    type: "text" | "system";
    isRead: boolean;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
  };
}

export interface ConversationUpdate {
  conversation: {
    id: string;
    lastMessage: string;
    lastMessageAt: string;
    isBuyerTyping: boolean;
    isSellerTyping: boolean;
  };
}

export interface TypingStatus {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    const token = useAuthStore.getState().accessToken;

    if (!token) {
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    this.socket = io("http://localhost:3000/chat", {
      query: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      // Emit custom event for connection status change
      this.emit("connectionStatusChanged", { connected: true });
    });

    this.socket.on("disconnect", () => {
      // Emit custom event for connection status change
      this.emit("connectionStatusChanged", { connected: false });
    });

    this.socket.on("error", () => {
      // Socket error
    });

    this.socket.on("connect_error", () => {
      // Socket connection error
    });

    this.socket.on("newMessage", (data: SocketMessage) => {
      this.emit("newMessage", data);
      this.emit("globalNotification", {
        type: "newMessage",
        data: data.message,
        conversationId: data.conversationId,
      });
    });

    this.socket.on("conversationUpdated", (data: ConversationUpdate) => {
      this.emit("conversationUpdated", data);
    });

    this.socket.on("userTyping", (data: TypingStatus) => {
      this.emit("userTyping", data);
    });

    this.socket.on(
      "messagesRead",
      (data: { conversationId: string; readBy: string }) => {
        this.emit("messagesRead", data);
      }
    );

    this.socket.on("testResponse", () => {
      // Test response received
    });
  }

  sendMessage(conversationId: string, content: string) {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit("sendMessage", { conversationId, content });
  }

  updateTypingStatus(conversationId: string, isTyping: boolean) {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit("typing", { conversationId, isTyping });
  }

  markAsRead(conversationId: string) {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit("markAsRead", { conversationId });
  }

  joinConversation(conversationId: string) {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit("joinConversation", conversationId);
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
