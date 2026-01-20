
import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  senderId: string;
  message: string;
  timestamp: Date;
  messageId: string;
}

interface ChatPanelProps {
  currentUser: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  } | null;
  sessionId: string;
  onSendMessage: (message: string) => void;
  messages: ChatMessage[];
  activeUsers: any[];
  isVisible: boolean;
  onClose: () => void;
  layoutMode?: 'floating' | 'embedded';
  isEmbedded?: boolean;
}

interface ChatWidgetProps extends ChatPanelProps {
  onToggleChat?: () => void;
}

const ChatPanel: React.FC<ChatWidgetProps> = ({
  currentUser,
  onSendMessage,
  messages,
  activeUsers,
  isVisible,
  layoutMode,
  isEmbedded
}) => {
  const [newMessage, setNewMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrentUserDisplayName = () => {
    if (currentUser?.firstName || currentUser?.lastName) {
      return `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    }
    return currentUser?.id || 'You';
  };

  /* ===========================
     EMBEDDED MODE
  ============================ */
  if (layoutMode === 'embedded' || isEmbedded) {
    return (
      <div className="flex h-full w-full flex-col bg-[#0D1117] text-gray-200 border-l border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[40px] border-b border-gray-800">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>Session Chat</span>
            <span className="text-xs text-gray-400">
              • {activeUsers.length} online
            </span>
          </div>
          {/* <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            ✕
          </button> */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No messages yet
            </div>
          ) : (
            messages.map((msg, index) => {
              const isCurrentUser = msg.senderId === currentUser?.id;
              const displayName = isCurrentUser
                ? getCurrentUserDisplayName()
                : `User${activeUsers.findIndex(u => u.userId === msg.senderId) + 1}`;

              return (
                <div
                  key={msg.messageId || index}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-md text-sm ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#161B22] text-gray-200 border border-gray-800'
                    }`}
                  >
                    {!isCurrentUser && (
                      <div className="text-xs text-gray-400 mb-1">
                        {displayName}
                      </div>
                    )}
                    <div>{msg.message}</div>
                    <div className="text-[10px] mt-1 opacity-60 text-right">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="border-t border-gray-800 p-3 flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message…"
            maxLength={500}
            className="flex-1 bg-[#0D1117] border border-gray-800 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    );
  }

  /* ===========================
     FLOATING MODE
  ============================ */
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 flex flex-col bg-[#0D1117] text-gray-200 border border-gray-800 rounded-lg shadow-xl z-50">
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-[40px] border-b border-gray-800">
        <span className="text-sm font-medium">
          Session Chat • {activeUsers.length}
        </span>
        {/* <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
          ✕
        </button> */}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((msg, index) => {
          const isCurrentUser = msg.senderId === currentUser?.id;

          return (
            <div
              key={msg.messageId || index}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-2 py-1 rounded text-xs ${
                  isCurrentUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#161B22] border border-gray-800'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2 border-t border-gray-800 flex gap-1">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-[#0D1117] border border-gray-800 rounded px-2 py-1 text-xs focus:outline-none"
          placeholder="Message…"
        />
        <button
          disabled={!newMessage.trim()}
          className="px-3 py-1 text-xs bg-blue-600 rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
