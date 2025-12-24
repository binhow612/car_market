import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAssistant } from "../contexts/AssistantContext";
import type { MessageAction } from "../types/assistant.types";

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export function VirtualAssistant() {
  const {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    unreadCount,
    notificationCount,
    sendMessage,
    toggleAssistant,
    minimizeAssistant,
    clearMessages,
    markAsRead,
  } = useAssistant();

  const totalBadgeCount = unreadCount + notificationCount;

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // SỬA ĐỔI: Đổi ref từ Input sang Textarea để hỗ trợ nhiều dòng
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Auto-scroll logic
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, isTyping]); // Thêm isTyping để scroll khi loading hiện ra

  // Focus logic: Luôn focus vào ô nhập liệu khi mở hoặc khi hết typing (để chắc chắn)
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      // Chỉ focus nếu người dùng không đang bôi đen văn bản hoặc làm gì đó khác
      if (document.activeElement !== inputRef.current) {
         inputRef.current.focus();
      }
    }
  }, [isOpen, isMinimized, isTyping]);

  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  // Logic tự động chỉnh chiều cao của textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`; // Max height 120px
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return; // Chặn gửi nếu đang typing, nhưng không disable input
    
    const message = inputValue;
    setInputValue("");
    // Reset height textarea về mặc định
    if (inputRef.current) {
      inputRef.current.style.height = "auto"; 
      inputRef.current.focus(); // Giữ focus ngay lập tức
    }
    await sendMessage(message);
  };

  // SỬA ĐỔI: Xử lý phím bấm cho Textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Ngăn xuống dòng mặc định của Enter
      handleSend();
    }
    // Shift + Enter sẽ tự động xuống dòng nhờ bản chất của thẻ textarea
  };

  const handleAction = (action: MessageAction) => {
    setTimeout(() => {
      if (action.action === "navigate" && action.data?.url) {
        navigate(action.data.url);
      } else if (action.action === "view_listing" && action.data?.listingId) {
        navigate(`/cars/${action.data.listingId}`);
      } else if (action.action === "view_my_listings") {
        navigate("/my-listings");
      } else if (action.action === "view_favorites") {
        navigate("/favorites");
      } else if (action.action === "view_conversations") {
        navigate("/conversations");
      }
    }, 100);
  };

  const getImageUrl = (path?: string) => {
    if (!path) return "/placeholder-car.png";
    if (path.startsWith("http")) return path;
    return `${SERVER_URL}${path}`;
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 z-50 bg-black hover:bg-gray-800 text-white rounded-full p-4 shadow-lg hover:shadow-2xl hover:shadow-gray-900/50 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-gray-300"
        aria-label="Open virtual assistant"
      >
        {totalBadgeCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-black text-xs font-bold rounded-full min-w-[24px] h-6 px-1.5 flex items-center justify-center animate-pulse shadow-lg ring-2 ring-black">
            {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
          </span>
        )}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl transition-all duration-300 ${
        isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
      } flex flex-col border-2 border-black`}
      style={{ maxHeight: "calc(100vh - 100px)" }}
    >
      {/* Header - GIỮ NGUYÊN */}
      <div className="bg-black text-white px-4 py-3 rounded-t-xl flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-black" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">CarMarket Assistant</h3>
            <p className="text-xs text-gray-400">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={minimizeAssistant} className="hover:bg-white/10 rounded-lg p-1.5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMinimized ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />}
            </svg>
          </button>
          <button onClick={clearMessages} className="hover:bg-white/10 rounded-lg p-1.5 transition-colors" title="Clear chat">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={toggleAssistant} className="hover:bg-white/10 rounded-lg p-1.5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${ // Thêm w-full để container chiếm hết chỗ
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* SỬA ĐỔI: Thêm min-w-0 và max-w-[85%] để đảm bảo break-words hoạt động đúng trong flex */}
                <div
                  className={`relative max-w-[85%] min-w-0 rounded-2xl px-4 py-2.5 ${
                    message.sender === "user"
                      ? "bg-black text-white"
                      : "bg-white text-gray-800 shadow-sm border border-gray-200"
                  }`}
                >
                  {/* SỬA ĐỔI: break-words để xuống dòng cho từ quá dài, whitespace-pre-wrap cho shift+enter */}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  
                  {/* Action Buttons & Listing Cards */}
                  {message.actions && message.actions.length > 0 && (
                    <div className={`flex flex-wrap gap-3 mt-3 ${message.sender === 'user' ? 'justify-end' : 'justify-center items-stretch'}`}>
                      {message.actions.map((action, idx) => {
                        if (action.action === "view_listing") {
                          return (
                            <div 
                              key={idx}
                              onClick={() => handleAction(action)}
                              className="group flex flex-col w-full bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1 mb-2"
                            >
                              <div className="h-32 w-full overflow-hidden relative bg-gray-100">
                                <img 
                                  src={getImageUrl(action.data?.image)}
                                  alt={action.label}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/placeholder-car.png"; 
                                  }}
                                />
                              </div>
                              <div className="p-3 flex flex-col gap-1">
                                <span className="text-sm font-bold text-gray-900 line-clamp-1" title={action.label}>
                                  {action.label}
                                </span>
                                {action.data?.price && (
                                  <span className="text-sm text-red-600 font-semibold">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(action.data.price))}
                                  </span>
                                )}
                                <div className="mt-2 w-full bg-black text-white text-xs py-2 rounded text-center group-hover:bg-gray-800 transition-colors font-medium">
                                  Xem chi tiết
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleAction(action)}
                            className="bg-gray-900 hover:bg-black active:bg-gray-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm hover:shadow-md"
                          >
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-gray-400"
                        : "text-gray-400"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-black p-4 bg-white rounded-b-xl">
            <div className="flex items-end space-x-2">
              {/* SỬA ĐỔI: Sử dụng Textarea thay vì Input */}
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown} // Dùng onKeyDown để bắt Shift+Enter chính xác hơn
                placeholder="Ask me anything..."
                rows={1}
                // SỬA ĐỔI: Bỏ disabled={isTyping} để luôn cho phép nhập
                className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm resize-none overflow-hidden min-h-[44px]"
                style={{ lineHeight: '1.5' }}
              />
              <button
                onClick={handleSend}
                // SỬA ĐỔI: Vẫn disable nút gửi khi đang typing để tránh gửi đúp, nhưng ô nhập liệu vẫn mở
                disabled={!inputValue.trim() || isTyping}
                className="bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 flex-shrink-0 h-[44px] w-[44px] flex items-center justify-center"
                aria-label="Send message"
              >
                {/* Hiển thị icon loading nếu đang typing, ngược lại hiện icon gửi */}
                {isTyping ? (
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}