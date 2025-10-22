/**
 * Example implementation of Virtual Assistant integration
 * This shows how to use the AssistantService with your existing UI
 */

import { useState, useEffect } from 'react';
import { AssistantService } from '../services/assistant.service';
import type { Message, SuggestionChip } from '../types/assistant.types';

export function AssistantExample() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([]);

  // Load welcome message on mount
  useEffect(() => {
    loadWelcomeMessage();
  }, []);

  const loadWelcomeMessage = async () => {
    try {
      const response = await AssistantService.getWelcomeMessage();
      const welcomeMessage = AssistantService.convertToMessage(response);
      setMessages([welcomeMessage]);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to load welcome message:', error);
    }
  };

  const handleSendMessage = async (query: string) => {
    if (!query.trim()) return;

    // Add user message
    const userMessage = AssistantService.createUserMessage(query);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Send query to assistant
      const response = await AssistantService.sendQuery(query);

      // Add assistant response
      const assistantMessage = AssistantService.convertToMessage(response);
      setMessages((prev) => [...prev, assistantMessage]);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "Sorry, I'm having trouble processing your request. Please try again.",
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: SuggestionChip) => {
    handleSendMessage(suggestion.query);
  };

  return (
    <div className="assistant-container">
      {/* Messages */}
      <div className="messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender}`}
          >
            <div className="message-content">{message.content}</div>
            
            {/* Action buttons */}
            {message.actions && message.actions.length > 0 && (
              <div className="message-actions">
                {message.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => AssistantService.handleMessageAction(action)}
                    className="action-button"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="message assistant typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="suggestion-chip"
            >
              {suggestion.icon && <span>{suggestion.icon}</span>}
              {suggestion.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage(inputValue);
            }
          }}
          placeholder="Ask me anything..."
          disabled={isTyping}
        />
        <button
          onClick={() => handleSendMessage(inputValue)}
          disabled={isTyping || !inputValue.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

/**
 * USAGE NOTES:
 * 
 * 1. Import this component or copy the logic to your existing assistant UI
 * 2. The AssistantService handles all API communication
 * 3. Messages are automatically converted to the correct format
 * 4. Suggestions are provided after each response
 * 5. Actions can trigger navigation or other behaviors
 * 
 * INTEGRATION STEPS:
 * 
 * 1. Make sure your backend server is running with OPENAI_API_KEY configured
 * 2. Import AssistantService in your component:
 *    import { AssistantService } from '../services/assistant.service';
 * 
 * 3. Use the service methods:
 *    - AssistantService.getWelcomeMessage()
 *    - AssistantService.sendQuery(query)
 *    - AssistantService.convertToMessage(response)
 *    - AssistantService.handleMessageAction(action)
 * 
 * 4. Style according to your design system
 */

