import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Video } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import StreamCard from './components/StreamCard';
import ChatSidebar from './components/ChatSidebar';
import StreamViewer from './components/StreamViewer';
import BroadcastPage from './components/BroadcastPage';
import WatcherPage from './components/WatcherPage';
import { mockStreams } from './data/mockStreams';

function App() {
  const [activeTab, setActiveTab] = useState('browse');
  const [showChat, setShowChat] = useState(true);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showWatcher, setShowWatcher] = useState(false);
  const [watcherBroadcasterId, setWatcherBroadcasterId] = useState<string>('');
  const [liveBroadcasters, setLiveBroadcasters] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize socket connection with real-time broadcaster updates
  useEffect(() => {
    console.log('🔌 Initializing socket connection for live broadcaster sync...');
    const newSocket = io('https://sockerserver.onrender.com/');
    setSocket(newSocket);

    // Socket connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      // Request initial broadcasters list immediately on connect
      newSocket.emit('request-broadcasters');
      console.log('📡 Requested initial broadcasters list');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      // Clear broadcasters list when disconnected
      setLiveBroadcasters([]);
    });

    newSocket.on('reconnect', () => {
      console.log('🔄 Socket reconnected, requesting broadcasters...');
      newSocket.emit('request-broadcasters');
    });

    // Real-time broadcaster list updates
    newSocket.on('broadcasters-list', (broadcastersList: string[]) => {
      console.log('📺 Live broadcasters updated:', {
        previous: liveBroadcasters,
        current: broadcastersList,
        added: broadcastersList.filter(b => !liveBroadcasters.includes(b)),
        removed: liveBroadcasters.filter(b => !broadcastersList.includes(b))
      });
      
      setLiveBroadcasters(broadcastersList);
      
      // Log changes for debugging
      const added = broadcastersList.filter(b => !liveBroadcasters.includes(b));
      const removed = liveBroadcasters.filter(b => !broadcastersList.includes(b));
      
      if (added.length > 0) {
        console.log('🟢 New broadcasters online:', added);
      }
      if (removed.length > 0) {
        console.log('🔴 Broadcasters went offline:', removed);
        
        // If currently watching a broadcaster that went offline, show notification
        if (showWatcher && removed.includes(watcherBroadcasterId)) {
          console.log('⚠️ Currently watched broadcaster went offline:', watcherBroadcasterId);
          // Could add a toast notification here
        }
      }
    });

    // Listen for individual broadcaster events for more granular updates
    newSocket.on('broadcaster-online', (broadcasterId: string) => {
      console.log('🟢 Broadcaster came online:', broadcasterId);
      setLiveBroadcasters(prev => {
        if (!prev.includes(broadcasterId)) {
          return [...prev, broadcasterId];
        }
        return prev;
      });
    });

    newSocket.on('broadcaster-offline', (broadcasterId: string) => {
      console.log('🔴 Broadcaster went offline:', broadcasterId);
      setLiveBroadcasters(prev => prev.filter(b => b !== broadcasterId));
      
      // If currently watching this broadcaster, could handle gracefully
      if (showWatcher && broadcasterId === watcherBroadcasterId) {
        console.log('⚠️ Currently watched broadcaster disconnected');
      }
    });

    // Periodic broadcaster list refresh (fallback)
    const refreshInterval = setInterval(() => {
      if (newSocket.connected) {
        console.log('🔄 Periodic broadcaster list refresh...');
        newSocket.emit('request-broadcasters');
      }
    }, 30000); // Refresh every 30 seconds as fallback

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection...');
      clearInterval(refreshInterval);
      newSocket.close();
    };
  }, []); // Empty dependency array to run once on mount

  // Handle watching a specific live broadcaster
  const handleWatchLive = (broadcasterId: string) => {
    console.log('👀 Starting to watch broadcaster:', broadcasterId);
    setWatcherBroadcasterId(broadcasterId);
    setShowWatcher(true);
    setSidebarOpen(false); // Close mobile sidebar
  };

  // Handle stream selection from cards
  const handleStreamSelect = (streamId: string) => {
    console.log('🎬 Stream selected:', streamId);
    
    // Check if this is a live broadcaster stream
    if (streamId.startsWith('live-')) {
      const broadcasterId = streamId.replace('live-', '');
      console.log('📡 Detected live broadcaster stream:', broadcasterId);
      handleWatchLive(broadcasterId);
    } else {
      // Regular mock stream
      console.log('🎭 Detected mock stream:', streamId);
      setSelectedStream(streamId);
    }
    setSidebarOpen(false); // Close mobile sidebar
  };

  // Create live streams from socket broadcasters + mock data
  const liveStreams = [
    // Real live broadcasters from socket - these update in real-time
    ...liveBroadcasters.map((broadcasterId, index) => ({
      id: `live-${broadcasterId}`,
      streamer: broadcasterId,
      game: 'Live Stream',
      title: `🔴 Live broadcast from ${broadcasterId}`,
      viewers: Math.floor(Math.random() * 1000) + 50,
      thumbnail: `https://images.pexels.com/photos/${7915439 + index}/pexels-photo-${7915439 + index}.jpeg?auto=compress&cs=tinysrgb&w=400`,
      isLive: true,
      category: 'Live'
    })),
    // Mock live streams for demo
    ...mockStreams.filter(stream => stream.isLive)
  ];

  const allStreams = [
    // Real live broadcasters first - these are synchronized in real-time
    ...liveBroadcasters.map((broadcasterId, index) => ({
      id: `live-${broadcasterId}`,
      streamer: broadcasterId,
      game: 'Live Stream',
      title: `🔴 Live broadcast from ${broadcasterId}`,
      viewers: Math.floor(Math.random() * 1000) + 50,
      thumbnail: `https://images.pexels.com/photos/${7915439 + index}/pexels-photo-${7915439 + index}.jpeg?auto=compress&cs=tinysrgb&w=400`,
      isLive: true,
      category: 'Live'
    })),
    // Then mock streams
    ...mockStreams
  ];

  // If watcher page is active
  if (showWatcher) {
    return (
      <WatcherPage 
        onBack={() => {
          setShowWatcher(false);
          setWatcherBroadcasterId('');
        }}
        broadcasterId={watcherBroadcasterId}
      />
    );
  }

  // If broadcast page is active
  if (showBroadcast) {
    return (
      <BroadcastPage onBack={() => setShowBroadcast(false)} />
    );
  }

  // If a stream is selected, show the stream viewer
  if (selectedStream) {
    const stream = allStreams.find(s => s.id === selectedStream);
    if (stream) {
      return (
        <StreamViewer 
          stream={stream} 
          onBack={() => setSelectedStream(null)}
          showChat={showChat}
          setShowChat={setShowChat}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex h-screen">
        {/* Sidebar - receives real-time broadcaster updates */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onStreamSelect={handleStreamSelect}
          onBroadcast={() => setShowBroadcast(true)}
          onWatchLive={handleWatchLive}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          liveBroadcasters={liveBroadcasters} // Pass live broadcasters directly
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            onBroadcast={() => setShowBroadcast(true)}
            onWatcher={() => setShowWatcher(true)}
            onMenuClick={() => setSidebarOpen(true)}
          />
          
          {/* Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Stream Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-3 sm:p-4 lg:p-6">
                {/* Browse Header */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Browse</h1>
                      <div className="flex flex-wrap items-center gap-2">
                        <button className="bg-gray-800 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded text-sm font-medium transition-colors">
                          Categories
                        </button>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded text-sm font-medium transition-colors">
                          Live Channels
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400 font-medium text-sm sm:text-base">
                        {liveStreams.length} Live
                      </span>
                    </div>
                  </div>

                  {/* Live Broadcasters Section - Updates in real-time */}
                  {liveBroadcasters.length > 0 && (
                    <div className="mb-6 sm:mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                          <span>🔴 Live Now</span>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        </h2>
                        <button 
                          onClick={() => setShowWatcher(true)}
                          className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                        >
                          View All
                        </button>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-red-400 font-medium text-sm">
                            {liveBroadcasters.length} Real Broadcaster{liveBroadcasters.length !== 1 ? 's' : ''} Online
                          </span>
                          <span className="text-gray-500 text-xs">• Updates live</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {liveBroadcasters.map((broadcaster) => (
                            <button
                              key={broadcaster}
                              onClick={() => handleWatchLive(broadcaster)}
                              className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors text-left w-full group"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 relative">
                                {broadcaster.charAt(0).toUpperCase()}
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border border-gray-700 rounded-full animate-pulse"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium font-mono truncate group-hover:text-purple-300 transition-colors">{broadcaster}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  <span className="text-red-400 text-xs font-medium">LIVE</span>
                                  <span className="text-gray-500 text-xs">• Real-time</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stream Grid - Updates automatically when broadcasters change */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                  {allStreams.map((stream) => (
                    <StreamCard
                      key={stream.id}
                      streamer={stream.streamer}
                      game={stream.game}
                      title={stream.title}
                      viewers={stream.viewers}
                      thumbnail={stream.thumbnail}
                      isLive={stream.isLive}
                      category={stream.category}
                      onClick={() => handleStreamSelect(stream.id)}
                    />
                  ))}
                </div>

                {/* Empty State */}
                {allStreams.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-2">No streams available</h3>
                    <p className="text-gray-400 text-sm mb-6 px-4">
                      Be the first to go live or check back later for more content
                    </p>
                    <button
                      onClick={() => setShowBroadcast(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Start Broadcasting
                    </button>
                  </div>
                )}

                {/* Connection Status Indicator */}
                <div className="fixed bottom-4 right-4 z-10">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    socket?.connected 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white animate-pulse'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      socket?.connected ? 'bg-white' : 'bg-white animate-pulse'
                    }`}></div>
                    <span>
                      {socket?.connected ? 'Live Updates Active' : 'Reconnecting...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;