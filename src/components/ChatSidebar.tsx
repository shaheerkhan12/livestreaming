import React, { useState } from 'react';
import { Send, Smile, Gift } from 'lucide-react';

const ChatSidebar: React.FC = () => {
  const [message, setMessage] = useState('');

  const messages = [
    { user: 'StreamFan2024', message: 'Great gameplay! 🔥', time: '2m' },
    { user: 'GamerPro', message: 'How did you do that move?', time: '3m' },
    { user: 'ChatMod', message: 'Welcome new followers!', time: '5m', isMod: true },
    { user: 'ViewerX', message: 'This stream is amazing!', time: '7m' },
    { user: 'ProPlayer', message: 'Nice setup!', time: '10m' },
  ];

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full">
      {/* Chat header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-semibold">Stream Chat</h3>
        <p className="text-gray-400 text-sm">1,247 viewers</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index} className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${
                msg.isMod ? 'text-green-400' : 'text-purple-400'
              }`}>
                {msg.user}
              </span>
              <span className="text-gray-500 text-xs">{msg.time}</span>
            </div>
            <p className="text-gray-300 text-sm">{msg.message}</p>
          </div>
        ))}
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-2 mb-3">
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Gift className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          <button className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;