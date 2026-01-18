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
  activeUsers: any[]; // Array of active users in the session
  isVisible: boolean;
  onClose: () => void;
}

interface ChatWidgetProps extends ChatPanelProps {
  onToggleChat?: () => void;
}

const ChatPanel: React.FC<ChatWidgetProps> = ({
  currentUser,
  sessionId,
  onSendMessage,
  messages,
  activeUsers,
  isVisible,
  onClose,
  onToggleChat
}) => {
  const [newMessage, setNewMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
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

  // If chat is not visible, show only the floating button
  if (!isVisible) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={onToggleChat}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Open chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {activeUsers.length > 1 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {activeUsers.length - 1}
            </span>
          )}
        </button>
      </div>
    );
  }

  // When chat is visible, show the full panel
  return (
    <div className="fixed bottom-6 left-6 w-80 bg-white text-gray-800 rounded-lg shadow-2xl z-50 flex flex-col h-[500px] max-h-[80vh] border border-gray-200">
      {/* Chat Header */}
      <div className="bg-blue-600 p-4 rounded-t-lg text-white flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Session Chat
          </h2>
          <span className="ml-2 bg-blue-700 text-xs px-2 py-1 rounded-full">
            {activeUsers.length} online
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-blue-200 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Online Users */}
      <div className="bg-blue-50 p-2 border-b border-gray-200 text-sm text-gray-600">
        <div className="flex items-center">
          <span className="text-green-500 mr-1">●</span>
          <span>Online: </span>
          <div className="flex flex-wrap ml-2">
            {activeUsers.map((user, index) => (
              <span key={user.userId || index} className="mr-2 mb-1">
                {user.userId === currentUser?.id ? 'You' : `User${index + 1}`}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 italic">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => {
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
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isCurrentUser
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    {!isCurrentUser && (
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        {displayName}
                      </div>
                    )}
                    <div className="text-sm">{msg.message}</div>
                    <div
                      className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;