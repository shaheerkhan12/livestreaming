import React from 'react';
import { ArrowLeft, Heart, Bell, Share, MoreHorizontal, Settings, Maximize, Volume2, Play, Pause } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import { Stream } from '../data/mockStreams';

interface StreamViewerProps {
  stream: Stream;
  onBack: () => void;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

const StreamViewer: React.FC<StreamViewerProps> = ({ stream, onBack, showChat, setShowChat }) => {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Navigation */}
      <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <span className="text-white font-bold text-lg">Live streaming</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
            Log In
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
            Sign Up
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3rem)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="relative bg-black aspect-video">
            <img
              src={stream.thumbnail}
              alt={stream.title}
              className="w-full h-full object-cover"
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent">
              {/* Play/Pause Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all">
                  <Play className="w-8 h-8 text-white ml-1" />
                </button>
              </div>
              
              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button className="text-white hover:text-gray-300">
                      <Play className="w-5 h-5" />
                    </button>
                    <button className="text-white hover:text-gray-300">
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <div className="w-20 h-1 bg-gray-600 rounded-full">
                      <div className="w-3/4 h-full bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="text-white hover:text-gray-300">
                      <Settings className="w-5 h-5" />
                    </button>
                    <button className="text-white hover:text-gray-300">
                      <Maximize className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-600 rounded-full mt-2">
                  <div className="w-1/3 h-full bg-purple-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">LIVE</span>
            </div>

            {/* Viewer Count */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded">
              {stream.viewers.toLocaleString()} viewers
            </div>
          </div>

          {/* Stream Info */}
          <div className="p-6 bg-gray-900">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-lg font-bold text-white">
                  {stream.streamer.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">{stream.title}</h1>
                  <div className="flex items-center space-x-4 text-purple-400">
                    <span className="font-medium">{stream.streamer}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">{stream.game}</span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                    <span>{stream.category}</span>
                    <span>•</span>
                    <span>{stream.viewers.toLocaleString()} viewers</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>Follow</span>
                </button>
                
                <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors">
                  <Bell className="w-4 h-4" />
                </button>
                
                <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors">
                  <Share className="w-4 h-4" />
                </button>
                
                <button className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && <ChatSidebar />}
      </div>
    </div>
  );
};

export default StreamViewer;