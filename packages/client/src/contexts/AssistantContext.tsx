import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { Message, AssistantState } from "../types/assistant.types";
import { AssistantService } from "../services/assistant.service";

interface AssistantContextType extends AssistantState {
  sendMessage: (content: string) => Promise<void>;
  toggleAssistant: () => void;
  minimizeAssistant: () => void;
  clearMessages: () => Promise<void>;
  markAsRead: () => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

interface AssistantProviderProps {
  children: ReactNode;
}

export const AssistantProvider = ({ children }: AssistantProviderProps) => {
  const [state, setState] = useState<AssistantState>({
    isOpen: false,
    isMinimized: false,
    messages: [],
    isTyping: false,
    unreadCount: 0,
  });

  // Initialize assistant with welcome message
  useEffect(() => {
    if (state.messages.length === 0) {
      (async () => {
        const welcomeResponse = await AssistantService.getWelcomeMessage();
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          content: welcomeResponse.message,
          sender: "assistant",
          timestamp: new Date(),
          type: "text",
          actions: welcomeResponse.actions,
        };
        setState(prev => ({ ...prev, messages: [welcomeMessage] }));
      })();
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
    }));

    // Simulate typing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Get assistant response
      const response = await AssistantService.sendQuery(content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: "assistant",
        timestamp: new Date(),
        type: response.actions ? "action" : "text",
        actions: response.actions,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isTyping: false,
        unreadCount: prev.isOpen ? prev.unreadCount : prev.unreadCount + 1,
      }));
    } catch (error: any) {
      console.error("Assistant error:", error);
      
      // Provide more specific error messages based on error type
      let errorContent = "I'm sorry, I encountered an error. Please try again or contact support if the issue persists.";
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorContent = "I'm taking longer than usual to respond. This might be due to the AI model loading for the first time. Please try again in a moment.";
      } else if (error.response?.status === 500) {
        errorContent = "I'm experiencing some technical difficulties. Please try rephrasing your question or try again in a moment.";
      } else if (error.response?.status === 401) {
        errorContent = "It looks like you need to log in to use the assistant. Please log in and try again.";
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        sender: "assistant",
        timestamp: new Date(),
        type: "text",
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false,
      }));
    }
  }, []);

  const toggleAssistant = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      isMinimized: false,
      unreadCount: !prev.isOpen ? 0 : prev.unreadCount,
    }));
  }, []);

  const minimizeAssistant = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }));
  }, []);

  const clearMessages = useCallback(async () => {
    const welcomeResponse = await AssistantService.getWelcomeMessage();
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: welcomeResponse.message,
      sender: "assistant",
      timestamp: new Date(),
      type: "text",
    };
    
    setState(prev => ({
      ...prev,
      messages: [welcomeMessage],
    }));
  }, []);

  const markAsRead = useCallback(() => {
    setState(prev => ({ ...prev, unreadCount: 0 }));
  }, []);

  return (
    <AssistantContext.Provider
      value={{
        ...state,
        sendMessage,
        toggleAssistant,
        minimizeAssistant,
        clearMessages,
        markAsRead,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return context;
};
