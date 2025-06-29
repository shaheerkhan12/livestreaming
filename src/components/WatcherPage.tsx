import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Settings, Maximize, Users, Wifi, AlertCircle, Play, RefreshCw, Menu, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface WatcherPageProps {
  onBack: () => void;
  broadcasterId?: string; // Optional broadcaster ID to auto-connect
}

const WatcherPage: React.FC<WatcherPageProps> = ({ onBack, broadcasterId }) => {
  const receiverVideoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [broadcastersList, setBroadcastersList] = useState<string[]>([]);
  const [selectedBroadcaster, setSelectedBroadcaster] = useState<string>(broadcasterId || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [streamQuality, setStreamQuality] = useState<'auto' | '1080p' | '480p' | '360p'>('1080p');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [hasAudioTrack, setHasAudioTrack] = useState(false);
  const [streamAssigned, setStreamAssigned] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [videoStats, setVideoStats] = useState<{
    width: number;
    height: number;
    readyState: number;
    currentTime: number;
    duration: number;
  }>({ width: 0, height: 0, readyState: 0, currentTime: 0, duration: 0 });

  const config = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      },
      {urls:"turn.speed.cloudflare.com:50000", "username":"f618bf62a31670a561c4167dfdb52c04cba9fbe2d0725af43562504b05c8c9bc324523dc61dc9c1b0fb0a2fde669cfe28ec737be2ebb76d74474a03d4761a04c","credential":"aba9b169546eb6dcc7bfb1cdf34544cf95b5161d602e3b5fa7c8342b2e9802fb"}
    ]
  };

  const addDebugInfo = (message: string) => {
    console.log(`[WatcherPage] ${message}`);
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const updateVideoStats = () => {
    if (receiverVideoRef.current) {
      const video = receiverVideoRef.current;
      setVideoStats({
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
        currentTime: video.currentTime,
        duration: video.duration || 0
      });
    }
  };

  const enableAudio = () => {
    if (receiverVideoRef.current) {
      receiverVideoRef.current.muted = false;
      setIsMuted(false);
      addDebugInfo('Audio enabled by user');
    }
  };

  const joinBroadcast = (broadcasterToJoin?: string) => {
    const targetBroadcaster = broadcasterToJoin || selectedBroadcaster;
    
    if (socket && targetBroadcaster && socketConnected) {
      addDebugInfo(`Joining broadcast: ${targetBroadcaster}`);
      setConnectionStatus('connecting');
      setStreamAssigned(false);
      setIsPlaying(false);
      setNeedsUserInteraction(false);
      setIsConnected(false);
      
      // Update selected broadcaster if different
      if (targetBroadcaster !== selectedBroadcaster) {
        setSelectedBroadcaster(targetBroadcaster);
      }
      
      // Reset video element
      if (receiverVideoRef.current) {
        if (receiverVideoRef.current.srcObject) {
          const stream = receiverVideoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        receiverVideoRef.current.srcObject = null;
      }
      
      // Emit watcher event with broadcaster ID - exactly like Angular
      socket.emit('watcher', targetBroadcaster);
      
      // Close sidebar on mobile after joining
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
      }
    } else {
      addDebugInfo(`Cannot join broadcast - socket: ${!!socket}, broadcaster: ${targetBroadcaster}, connected: ${socketConnected}`);
    }
  };

  const refreshConnection = () => {
    if (selectedBroadcaster) {
      addDebugInfo('Refreshing connection...');
      setStreamAssigned(false);
      setIsPlaying(false);
      setNeedsUserInteraction(false);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Reset video element
      if (receiverVideoRef.current) {
        if (receiverVideoRef.current.srcObject) {
          const stream = receiverVideoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        receiverVideoRef.current.srcObject = null;
      }
      
      // Rejoin broadcast
      setTimeout(() => {
        joinBroadcast();
      }, 1000);
    }
  };

  useEffect(() => {
    // Initialize socket connection - exactly like Angular
    const newSocket = io('https://sockerserver.onrender.com/');
    setSocket(newSocket);
    addDebugInfo('Socket connection initialized');

    // Initialize peer connection - exactly like Angular
    const newPeerConnection = new RTCPeerConnection(config);
    setPeerConnection(newPeerConnection);
    addDebugInfo('Peer connection initialized');

    // Socket event listeners - matching Angular watcher exactly
    newSocket.on('connect', () => {
      addDebugInfo('Socket connected successfully');
      console.log('connect triggered watcher component');
      setSocketConnected(true);
      
      // Emit watcher without ID first - like Angular does
      newSocket.emit('watcher');
      
      // Request broadcasters list immediately
      newSocket.emit('request-broadcasters');
      addDebugInfo('Requested broadcasters list after connect');
    });

    newSocket.on('broadcasters-list', (broadcastersList: string[]) => {
      setBroadcastersList(broadcastersList);
      addDebugInfo(`Received ${broadcastersList.length} broadcasters: ${broadcastersList.join(', ')}`);
      console.log('Available broadcasters:', broadcastersList);
      
      // Auto-connect if broadcaster ID was provided and socket is connected
      if (broadcasterId && socketConnected && broadcastersList.includes(broadcasterId)) {
        addDebugInfo(`Auto-connecting to broadcaster: ${broadcasterId}`);
        setTimeout(() => {
          joinBroadcast(broadcasterId);
        }, 500);
      }
    });

    // Handle offer from broadcaster - exactly like Angular
    newSocket.on("offer", (id: string, description: RTCSessionDescriptionInit) => {
      addDebugInfo(`Offer received from broadcaster: ${id}`);
      console.log('offer triggered watcher component', id);
      
      setConnectionStatus('connecting');
      setStreamAssigned(false);
      setIsPlaying(false);
      setNeedsUserInteraction(false);
      
      // Handle offer exactly like Angular watcher
      newPeerConnection
        .setRemoteDescription(description)
        .then(() => {
          addDebugInfo('Set remote description successfully');
          return newPeerConnection.createAnswer();
        })
        .then((sdp) => {
          addDebugInfo('Created answer successfully');
          return newPeerConnection.setLocalDescription(sdp);
        })
        .then(() => {
          addDebugInfo('Set local description successfully');
          newSocket.emit("answer", id, newPeerConnection.localDescription);
          addDebugInfo(`Sent answer to broadcaster: ${id}`);
        })
        .catch((error) => {
          console.error('Error handling offer:', error);
          addDebugInfo(`Error handling offer: ${error.message}`);
          setConnectionStatus('disconnected');
        });

      // Handle incoming stream - exactly like Angular
      newPeerConnection.ontrack = (event: RTCTrackEvent) => {
        addDebugInfo(`Track received: ${event.track.kind} track`);
        console.log('Track received:', event);
        
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          addDebugInfo(`Assigning stream to video element`);
          
          // Assign stream directly to video element - like Angular
          if (receiverVideoRef.current) {
            receiverVideoRef.current.srcObject = stream;
            setStreamAssigned(true);
            setIsConnected(true);
            setConnectionStatus('connected');
            
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            
            setHasVideoTrack(videoTracks.length > 0);
            setHasAudioTrack(audioTracks.length > 0);
            
            addDebugInfo(`Stream assigned: ${videoTracks.length} video, ${audioTracks.length} audio tracks`);
            
            // Try to play the video
            receiverVideoRef.current.play()
              .then(() => {
                addDebugInfo('Video started playing automatically');
                setIsPlaying(true);
                setNeedsUserInteraction(false);
              })
              .catch((error) => {
                addDebugInfo(`Autoplay failed: ${error.message}`);
                setNeedsUserInteraction(true);
                setIsPlaying(false);
              });
          }
        }
      };

      // Handle ICE candidates - exactly like Angular
      newPeerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          addDebugInfo('Sending ICE candidate to broadcaster');
          newSocket.emit("candidate", id, event.candidate);
        } else {
          addDebugInfo('ICE gathering completed');
        }
      };

      // Monitor connection state
      newPeerConnection.onconnectionstatechange = () => {
        const state = newPeerConnection.connectionState;
        addDebugInfo(`Connection state: ${state}`);
        console.log('Connection state:', state);
        
        if (state === 'connected') {
          setConnectionStatus('connected');
        } else if (state === 'disconnected' || state === 'failed') {
          setConnectionStatus('disconnected');
          setIsConnected(false);
          setStreamAssigned(false);
          setIsPlaying(false);
          setNeedsUserInteraction(false);
        } else if (state === 'connecting') {
          setConnectionStatus('connecting');
        }
      };

      // Monitor ICE connection state
      newPeerConnection.oniceconnectionstatechange = () => {
        const iceState = newPeerConnection.iceConnectionState;
        addDebugInfo(`ICE connection state: ${iceState}`);
        console.log('ICE connection state:', iceState);
      };
    });

    // Handle ICE candidates from broadcaster - exactly like Angular
    newSocket.on('candidate', (id: string, candidate: RTCIceCandidateInit) => {
      addDebugInfo(`Received ICE candidate from broadcaster: ${id}`);
      newPeerConnection
        .addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => {
          addDebugInfo('ICE candidate added successfully');
        })
        .catch((e) => {
          console.error('Error adding ICE candidate:', e);
          addDebugInfo(`Error adding ICE candidate: ${e.message}`);
        });
    });

    newSocket.on('disconnect', () => {
      addDebugInfo('Socket disconnected');
      setSocketConnected(false);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      setStreamAssigned(false);
      setIsPlaying(false);
      setNeedsUserInteraction(false);
    });

    // Update video stats periodically
    const statsInterval = setInterval(updateVideoStats, 2000);

    // Cleanup on unmount - like Angular
    const cleanup = () => {
      addDebugInfo('Cleaning up connections');
      clearInterval(statsInterval);
      
      // Stop any existing stream
      if (receiverVideoRef.current?.srcObject) {
        const stream = receiverVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      newSocket.close();
      newPeerConnection.close();
    };

    window.onunload = window.onbeforeunload = cleanup;

    return cleanup;
  }, []);

  // Auto-connect effect when socket connects and broadcaster ID is available
  useEffect(() => {
    if (socketConnected && broadcasterId && broadcastersList.includes(broadcasterId) && !isConnected && connectionStatus === 'disconnected') {
      addDebugInfo(`Auto-connecting to broadcaster: ${broadcasterId} (socket connected)`);
      setTimeout(() => {
        joinBroadcast(broadcasterId);
      }, 500);
    }
  }, [socketConnected, broadcasterId, broadcastersList, isConnected, connectionStatus]);

  const startPlayback = async () => {
    if (!receiverVideoRef.current) return;

    try {
      const video = receiverVideoRef.current;
      
      addDebugInfo('User initiated playback');
      
      // Try unmuted first
      video.muted = false;
      await video.play();
      
      setIsMuted(false);
      setIsPlaying(true);
      setNeedsUserInteraction(false);
      addDebugInfo('Video playback started by user (unmuted)');
    } catch (error: any) {
      addDebugInfo(`Unmuted playback failed: ${error.message}`);
      
      // Fallback to muted playback
      try {
        receiverVideoRef.current.muted = true;
        await receiverVideoRef.current.play();
        setIsMuted(true);
        setIsPlaying(true);
        setNeedsUserInteraction(false);
        addDebugInfo('Video started in muted mode');
      } catch (mutedError: any) {
        addDebugInfo(`Even muted playback failed: ${mutedError.message}`);
      }
    }
  };

  const toggleMute = () => {
    if (receiverVideoRef.current) {
      receiverVideoRef.current.muted = !receiverVideoRef.current.muted;
      setIsMuted(receiverVideoRef.current.muted);
      addDebugInfo(`Audio ${receiverVideoRef.current.muted ? 'muted' : 'unmuted'}`);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      default: return 'Disconnected';
    }
  };

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
            <span className="text-white font-bold text-lg">Livestreaming</span>
          </div>
          
          <span className="text-gray-400 hidden sm:block">
            {selectedBroadcaster ? `Watching ${selectedBroadcaster}` : 'Stream Viewer'}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`hidden sm:flex items-center space-x-2 ${getConnectionStatusColor()}`}>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">{getConnectionStatusText()}</span>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3rem)] relative">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="flex-1 bg-black relative">
            <video
              ref={receiverVideoRef}
              className="w-full h-[95vh] object-cover"
              controls={false}
              autoPlay={false}
              playsInline
              muted={isMuted}
              style={{ backgroundColor: '#000' }}
            />
            
            {/* No Stream Connected State */}
            {!isConnected && !selectedBroadcaster && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center p-4">
                  <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg sm:text-xl">No Broadcaster Selected</p>
                  <p className="text-gray-500 text-sm">Select a broadcaster from the sidebar to start watching</p>
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="mt-4 lg:hidden bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Select Broadcaster
                  </button>
                </div>
              </div>
            )}

            {/* Connecting State */}
            {selectedBroadcaster && !isConnected && connectionStatus === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center p-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white text-lg sm:text-xl">Connecting to {selectedBroadcaster}</p>
                  <p className="text-gray-400 text-sm">Please wait while we establish the connection...</p>
                  <button
                    onClick={refreshConnection}
                    className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            )}

            {/* Stream Connected but Needs User Interaction */}
            {isConnected && needsUserInteraction && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 p-4">
                <div className="text-center">
                  <div className="bg-gray-900 rounded-lg p-6 sm:p-8 max-w-md w-full">
                    <Play className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">Stream Ready</h3>
                    <p className="text-gray-400 text-sm mb-6">
                      Connected to {selectedBroadcaster}. Click to start watching!
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={startPlayback}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <Play className="w-5 h-5" />
                        <span>Start Watching</span>
                      </button>
                      <button
                        onClick={enableAudio}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Enable Audio</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stream Connected but Black Screen */}
            {isConnected && !needsUserInteraction && !isPlaying && videoStats.width === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 p-4">
                <div className="text-center">
                  <div className="bg-gray-900 rounded-lg p-6 sm:p-8 max-w-md w-full">
                    <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">Stream Issues</h3>
                    <p className="text-gray-400 text-sm mb-6">
                      Connected to {selectedBroadcaster} but no video data received. Make sure they are broadcasting.
                    </p>
                    <button
                      onClick={refreshConnection}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Refresh Connection</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Connection Status */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between sm:hidden">
              <div className={`flex items-center space-x-2 ${getConnectionStatusColor()} bg-black bg-opacity-50 px-2 py-1 rounded`}>
                <Wifi className="w-3 h-3" />
                <span className="text-xs font-medium">{getConnectionStatusText()}</span>
              </div>
              
              {videoStats.width > 0 && (
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  {videoStats.width}x{videoStats.height}
                </div>
              )}
            </div>

            {/* Video Controls Overlay */}
            {isConnected && isPlaying && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                      onClick={toggleMute}
                      className="p-2 sm:p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    
                    <button
                      onClick={enableAudio}
                      disabled={!isMuted}
                      className="hidden sm:block bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Enable Audio
                    </button>
                    
                    <div className="hidden sm:flex items-center space-x-2 bg-black bg-opacity-50 rounded-full px-3 py-2">
                      <span className="text-white text-sm">Quality:</span>
                      <select
                        value={streamQuality}
                        onChange={(e) => setStreamQuality(e.target.value as any)}
                        className="bg-transparent text-white text-sm focus:outline-none"
                      >
                        <option value="auto" className="bg-gray-800">Auto</option>
                        <option value="720p" className="bg-gray-800">720p</option>
                        <option value="480p" className="bg-gray-800">480p</option>
                        <option value="360p" className="bg-gray-800">360p</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button 
                      onClick={refreshConnection}
                      className="p-2 sm:p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                    >
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    <button className="hidden sm:block p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all">
                      <Settings className="w-5 h-5" />
                    </button>
                    
                    <button className="hidden sm:block p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all">
                      <Maximize className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Status Indicators */}
            {connectionStatus === 'connecting' && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-yellow-600 text-white px-3 py-1 rounded">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-medium text-sm">CONNECTING</span>
              </div>
            )}

            {connectionStatus === 'connected' && isConnected && isPlaying && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-green-600 text-white px-3 py-1 rounded">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="font-medium text-sm">LIVE</span>
              </div>
            )}

            {connectionStatus === 'connected' && isConnected && !isPlaying && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-medium text-sm">READY</span>
              </div>
            )}

            {/* Desktop Video Stats Overlay */}
            {videoStats.width > 0 && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-xs hidden sm:block">
                {videoStats.width}x{videoStats.height}
              </div>
            )}
          </div>
        </div>

        {/* Broadcaster Selection Sidebar - Desktop */}
        <div className="hidden lg:flex w-80 bg-gray-900 border-l border-gray-800 flex-col">
          <SidebarContent 
            broadcastersList={broadcastersList}
            selectedBroadcaster={selectedBroadcaster}
            setSelectedBroadcaster={setSelectedBroadcaster}
            joinBroadcast={joinBroadcast}
            refreshConnection={refreshConnection}
            connectionStatus={connectionStatus}
            isConnected={isConnected}
            needsUserInteraction={needsUserInteraction}
            startPlayback={startPlayback}
            isMuted={isMuted}
            enableAudio={enableAudio}
            hasVideoTrack={hasVideoTrack}
            hasAudioTrack={hasAudioTrack}
            streamAssigned={streamAssigned}
            isPlaying={isPlaying}
            videoStats={videoStats}
            streamQuality={streamQuality}
            debugInfo={debugInfo}
            toggleMute={toggleMute}
            getConnectionStatusColor={getConnectionStatusColor}
            getConnectionStatusText={getConnectionStatusText}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowSidebar(false)}
            />
            
            {/* Sidebar */}
            <div className="relative w-full max-w-sm bg-gray-900 border-r border-gray-800 flex flex-col ml-auto">
              <SidebarContent 
                broadcastersList={broadcastersList}
                selectedBroadcaster={selectedBroadcaster}
                setSelectedBroadcaster={setSelectedBroadcaster}
                joinBroadcast={joinBroadcast}
                refreshConnection={refreshConnection}
                connectionStatus={connectionStatus}
                isConnected={isConnected}
                needsUserInteraction={needsUserInteraction}
                startPlayback={startPlayback}
                isMuted={isMuted}
                enableAudio={enableAudio}
                hasVideoTrack={hasVideoTrack}
                hasAudioTrack={hasAudioTrack}
                streamAssigned={streamAssigned}
                isPlaying={isPlaying}
                videoStats={videoStats}
                streamQuality={streamQuality}
                debugInfo={debugInfo}
                toggleMute={toggleMute}
                getConnectionStatusColor={getConnectionStatusColor}
                getConnectionStatusText={getConnectionStatusText}
                isMobile={true}
                onClose={() => setShowSidebar(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sidebar Content Component
interface SidebarContentProps {
  broadcastersList: string[];
  selectedBroadcaster: string;
  setSelectedBroadcaster: (broadcaster: string) => void;
  joinBroadcast: (broadcaster?: string) => void;
  refreshConnection: () => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  isConnected: boolean;
  needsUserInteraction: boolean;
  startPlayback: () => void;
  isMuted: boolean;
  enableAudio: () => void;
  hasVideoTrack: boolean;
  hasAudioTrack: boolean;
  streamAssigned: boolean;
  isPlaying: boolean;
  videoStats: any;
  streamQuality: string;
  debugInfo: string[];
  toggleMute: () => void;
  getConnectionStatusColor: () => string;
  getConnectionStatusText: () => string;
  isMobile?: boolean;
  onClose?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  broadcastersList,
  selectedBroadcaster,
  setSelectedBroadcaster,
  joinBroadcast,
  refreshConnection,
  connectionStatus,
  isConnected,
  needsUserInteraction,
  startPlayback,
  isMuted,
  enableAudio,
  hasVideoTrack,
  hasAudioTrack,
  streamAssigned,
  isPlaying,
  videoStats,
  streamQuality,
  debugInfo,
  toggleMute,
  getConnectionStatusColor,
  getConnectionStatusText,
  isMobile = false,
  onClose
}) => {
  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">Stream Controls</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Stream Information */}
      {selectedBroadcaster && (
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-white font-semibold mb-4">Current Stream</h3>
          
          <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {selectedBroadcaster.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium font-mono">{selectedBroadcaster}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-xs font-medium ${getConnectionStatusColor()}`}>
                    {getConnectionStatusText()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-2">
            {needsUserInteraction && (
              <button
                onClick={startPlayback}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Watching</span>
              </button>
            )}

            {isConnected && isMuted && (
              <button
                onClick={enableAudio}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Volume2 className="w-4 h-4" />
                <span>Enable Audio</span>
              </button>
            )}

            <button
              onClick={refreshConnection}
              disabled={!selectedBroadcaster}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* Available Broadcasters List */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-white font-semibold mb-4">Available Broadcasters</h3>
        
        <div className="space-y-2">
          {broadcastersList.length > 0 ? (
            broadcastersList.map((broadcaster) => (
              <button
                key={broadcaster}
                onClick={() => joinBroadcast(broadcaster)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                  selectedBroadcaster === broadcaster
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {broadcaster.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm font-mono truncate">{broadcaster}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-400 text-xs">LIVE</span>
                  </div>
                </div>

                {selectedBroadcaster === broadcaster && (
                  <div className="text-purple-400">
                    <Play className="w-4 h-4" />
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No broadcasters detected</p>
              <p className="text-gray-500 text-xs">Make sure a broadcaster is online</p>
            </div>
          )}
        </div>
      </div>

      {/* Stream Stats - Desktop Only */}
      {!isMobile && selectedBroadcaster && (
        <div className="p-4 border-t border-gray-800">
          <h3 className="text-white font-semibold mb-3">Stream Stats</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Video:</span>
              <span className={`text-sm font-medium ${hasVideoTrack ? 'text-green-400' : 'text-red-400'}`}>
                {hasVideoTrack ? 'Available' : 'Not Available'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Audio:</span>
              <span className={`text-sm font-medium ${hasAudioTrack ? 'text-green-400' : 'text-red-400'}`}>
                {hasAudioTrack ? 'Available' : 'Not Available'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Playing:</span>
              <span className={`text-sm font-medium ${isPlaying ? 'text-green-400' : 'text-yellow-400'}`}>
                {isPlaying ? 'Yes' : (needsUserInteraction ? 'Needs Click' : 'No')}
              </span>
            </div>

            {videoStats.width > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Resolution:</span>
                <span className="text-white text-sm font-medium">
                  {videoStats.width}x{videoStats.height}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Information - Desktop Only */}
      {!isMobile && debugInfo.length > 0 && (
        <div className="p-4 border-t border-gray-800">
          <h3 className="text-white font-semibold mb-2 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span>Debug Log</span>
          </h3>
          <div className="bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto custom-scrollbar">
            {debugInfo.map((info, index) => (
              <p key={index} className="text-gray-400 text-xs font-mono mb-1">{info}</p>
            ))}
          </div>
        </div>
      )}

      {/* Connection Controls */}
      <div className="p-4 border-t border-gray-800">
        <div className="space-y-2">
          <button
            onClick={toggleMute}
            disabled={!isPlaying}
            className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left flex items-center space-x-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default WatcherPage;