import React, { useState, useEffect } from 'react';
import { ChevronDown, Heart, Clock, Video, X, Menu, Wifi, WifiOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onStreamSelect: (streamId: string) => void;
  onBroadcast?: () => void;
  onWatchLive?: (broadcasterId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  liveBroadcasters?: string[]; // Accept live broadcasters from parent
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onStreamSelect, 
  onBroadcast, 
  onWatchLive,
  isOpen = true,
  onClose,
  liveBroadcasters = [] // Use broadcasters from parent if provided
}) => {
  const [localLiveBroadcasters, setLocalLiveBroadcasters] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Use broadcasters from parent (App.tsx) if provided, otherwise maintain local state
  const currentBroadcasters = liveBroadcasters.length > 0 ? liveBroadcasters : localLiveBroadcasters;

  useEffect(() => {
    console.log('🔌 [Sidebar] Initializing socket connection for real-time updates...');
    
    // Initialize socket connection for real-time broadcaster updates
    const newSocket = io('https://sockerserver.onrender.com/');
    setSocket(newSocket);

    // Connection status tracking
    newSocket.on('connect', () => {
      console.log('✅ [Sidebar] Socket connected');
      setIsConnected(true);
      // Request initial broadcasters list
      newSocket.emit('request-broadcasters');
      console.log('📡 [Sidebar] Requested initial broadcasters list');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ [Sidebar] Socket disconnected');
      setIsConnected(false);
      // Clear local broadcasters if not using parent's list
      if (liveBroadcasters.length === 0) {
        setLocalLiveBroadcasters([]);
      }
    });

    newSocket.on('reconnect', () => {
      console.log('🔄 [Sidebar] Socket reconnected');
      setIsConnected(true);
      newSocket.emit('request-broadcasters');
    });

    // Real-time broadcaster list updates (only if not using parent's list)
    newSocket.on('broadcasters-list', (broadcastersList: string[]) => {
      if (liveBroadcasters.length === 0) {
        console.log('📺 [Sidebar] Local broadcasters updated:', {
          previous: localLiveBroadcasters,
          current: broadcastersList,
          count: broadcastersList.length
        });
        
        setLocalLiveBroadcasters(broadcastersList);
        setLastUpdate(new Date());
        
        // Log changes
        const added = broadcastersList.filter(b => !localLiveBroadcasters.includes(b));
        const removed = localLiveBroadcasters.filter(b => !broadcastersList.includes(b));
        
        if (added.length > 0) {
          console.log('🟢 [Sidebar] New broadcasters:', added);
        }
        if (removed.length > 0) {
          console.log('🔴 [Sidebar] Broadcasters offline:', removed);
        }
      }
    });

    // Individual broadcaster events for immediate updates
    newSocket.on('broadcaster-online', (broadcasterId: string) => {
      if (liveBroadcasters.length === 0) {
        console.log('🟢 [Sidebar] Broadcaster online:', broadcasterId);
        setLocalLiveBroadcasters(prev => {
          if (!prev.includes(broadcasterId)) {
            setLastUpdate(new Date());
            return [...prev, broadcasterId];
          }
          return prev;
        });
      }
    });

    newSocket.on('broadcaster-offline', (broadcasterId: string) => {
      if (liveBroadcasters.length === 0) {
        console.log('🔴 [Sidebar] Broadcaster offline:', broadcasterId);
        setLocalLiveBroadcasters(prev => {
          const updated = prev.filter(b => b !== broadcasterId);
          if (updated.length !== prev.length) {
            setLastUpdate(new Date());
          }
          return updated;
        });
      }
    });

    // Periodic refresh as fallback
    const refreshInterval = setInterval(() => {
      if (newSocket.connected && liveBroadcasters.length === 0) {
        console.log('🔄 [Sidebar] Periodic refresh...');
        newSocket.emit('request-broadcasters');
      }
    }, 30000);

    // Cleanup on unmount
    return () => {
      console.log('🧹 [Sidebar] Cleaning up socket connection...');
      clearInterval(refreshInterval);
      newSocket.close();
    };
  }, [liveBroadcasters.length]); // Re-run if parent broadcaster management changes

  const handleWatchLive = (broadcasterId: string) => {
    console.log('👀 [Sidebar] Watching broadcaster:', broadcasterId);
    if (onWatchLive) {
      onWatchLive(broadcasterId);
    }
    // Close mobile sidebar after selection
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleBroadcast = () => {
    console.log('📡 [Sidebar] Starting broadcast...');
    if (onBroadcast) {
      onBroadcast();
    }
    // Close mobile sidebar after selection
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && onClose && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:relative top-0 left-0 z-50 lg:z-auto
        w-72 sm:w-80 lg:w-60
        h-full lg:h-auto
        bg-gray-900 border-r border-gray-800 
        flex flex-col
        transition-transform duration-300 ease-in-out
        overflow-y-auto
      `}>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <span className="text-white font-bold text-lg">Twitch</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* For You section */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm mb-3">For You</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-sm transition-colors">
              <span>Following</span>
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2.5 text-purple-400 bg-gray-800 rounded-lg text-sm font-medium">
              <span>Browse</span>
            </button>
          </div>
        </div>

        {/* Creator Tools */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Creator Tools</h3>
          </div>
          <div className="space-y-1">
            <button 
              onClick={handleBroadcast}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-purple-400 hover:bg-gray-800 hover:text-purple-300 rounded-lg text-sm transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Go Live</span>
            </button>
          </div>
        </div>

        {/* Following section */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Following</h3>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Heart className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-400 text-xs">
            Follow some channels to see them here!
          </p>
        </div>

        {/* Live Broadcasters - Real-time updates */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm flex items-center space-x-2">
                <span>Live Broadcasters</span>
                {isConnected ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-400" />
                )}
              </h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-xs font-medium">{currentBroadcasters.length}</span>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="mb-3">
              <div className={`flex items-center space-x-2 px-2 py-1 rounded text-xs ${
                isConnected 
                  ? 'bg-green-900 text-green-300' 
                  : 'bg-red-900 text-red-300'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'
                }`}></div>
                <span>
                  {isConnected ? 'Live Updates Active' : 'Reconnecting...'}
                </span>
              </div>
              {isConnected && currentBroadcasters.length > 0 && (
                <p className="text-gray-500 text-xs mt-1 px-2">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              {currentBroadcasters.length > 0 ? (
                currentBroadcasters.map((broadcaster) => (
                  <button
                    key={broadcaster}
                    onClick={() => handleWatchLive(broadcaster)}
                    className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-800 transition-colors group animate-fadeIn"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {broadcaster.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border border-gray-900 rounded-full animate-pulse"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-white text-sm font-medium truncate group-hover:text-purple-400 transition-colors font-mono">
                        {broadcaster}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-400 text-xs font-medium">LIVE</span>
                        <span className="text-gray-500 text-xs">• Real-time</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="relative">
                    <Video className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    {!isConnected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <WifiOff className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {isConnected ? 'No live broadcasters' : 'Connection lost'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {isConnected ? 'Check back later for live streams' : 'Attempting to reconnect...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden p-4 border-t border-gray-800">
          <div className="flex items-center justify-center space-x-4">
            <button className="text-gray-400 hover:text-white transition-colors">
              <span className="text-xs">Settings</span>
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <span className="text-xs">Help</span>
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <span className="text-xs">About</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;