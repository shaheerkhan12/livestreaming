import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Video, VideoOff, Mic, MicOff, Settings, Users, Eye, MessageCircle, Menu, X, MoreVertical } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface BroadcastPageProps {
  onBack: () => void;
}

const BroadcastPage: React.FC<BroadcastPageProps> = ({ onBack }) => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConnections, setPeerConnections] = useState<{ [key: string]: RTCPeerConnection }>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamTitle, setStreamTitle] = useState('My Live Stream');
  const [streamCategory, setStreamCategory] = useState('Just Chatting');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const config = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
      {
        urls: 'turn:openrelay.metered.ca:80',
        credential: 'openrelayproject',
        username: 'openrelayproject',
      }
    ],
  };

  useEffect(() => {
    // Initialize socket connection - exactly like Angular
    const newSocket = io('https://sockerserver.onrender.com/');
    setSocket(newSocket);

    // Use the same broadcaster ID as your Angular code
    const broadcasterID = 'lmVkQphpVgIdLNK7AABF';
    newSocket.emit('announce-broadcaster', broadcasterID);
    console.log('Announced broadcaster with ID:', broadcasterID);

    // Socket event listeners - matching your Angular implementation exactly
    newSocket.on('watcher', (id: string) => {
      console.log('watcher triggered', id);
      
      // Create NEW peer connection for each watcher - exactly like Angular
      const peerConnection = new RTCPeerConnection(config);
      
      // Store the peer connection - exactly like Angular
      setPeerConnections(prev => ({ ...prev, [id]: peerConnection }));

      // Get the current stream from video element - exactly like Angular
      if (remoteVideoRef.current?.srcObject) {
        const stream = remoteVideoRef.current.srcObject as MediaStream;
        
        // Add all tracks to the peer connection - matching Angular approach exactly
        stream.getTracks().forEach((track) => {
          console.log(`Adding ${track.kind} track to peer connection for watcher ${id}`);
          peerConnection.addTrack(track, stream);
        });
      } else {
        console.warn('No stream available to share with watcher');
        return;
      }

      // Set up ICE candidate handling - exactly like Angular
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate to watcher:', id);
          newSocket.emit('candidate', id, event.candidate);
        }
      };

      // Create offer and send to watcher - exactly like Angular
      peerConnection
        .createOffer()
        .then((sdp) => {
          console.log('Created offer for watcher:', id);
          return peerConnection.setLocalDescription(sdp);
        })
        .then(() => {
          console.log('Sending offer to watcher:', id);
          newSocket.emit('offer', id, peerConnection.localDescription);
        })
        .catch((error) => {
          console.error('Error creating offer:', error);
        });

      // Update viewer count
      setViewerCount(prev => prev + 1);
    });

    newSocket.on('answer', (id: string, description: RTCSessionDescriptionInit) => {
      console.log('answer triggered', id);
      
      // Find the specific peer connection for this watcher
      setPeerConnections(prev => {
        if (prev[id]) {
          prev[id].setRemoteDescription(description)
            .then(() => {
              console.log('Set remote description for watcher:', id);
            })
            .catch((error) => {
              console.error('Error setting remote description:', error);
            });
        }
        return prev;
      });
    });

    newSocket.on('candidate', (id: string, candidate: RTCIceCandidateInit) => {
      console.log('candidate triggered', id);
      
      // Find the specific peer connection for this watcher
      setPeerConnections(prev => {
        if (prev[id]) {
          prev[id].addIceCandidate(new RTCIceCandidate(candidate))
            .catch((error) => {
              console.error('Error adding ICE candidate:', error);
            });
        }
        return prev;
      });
    });

    newSocket.on('disconnectPeer', (id: string) => {
      console.log('Peer disconnected:', id);
      
      setPeerConnections(prev => {
        if (prev[id]) {
          prev[id].close();
          const updated = { ...prev };
          delete updated[id];
          setViewerCount(current => Math.max(0, current - 1));
          return updated;
        }
        return prev;
      });
    });

    // Auto-hide controls on mobile after 3 seconds
    let controlsTimeout: NodeJS.Timeout;
    const resetControlsTimeout = () => {
      clearTimeout(controlsTimeout);
      setShowControls(true);
      controlsTimeout = setTimeout(() => {
        if (window.innerWidth < 768) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleUserInteraction = () => {
      resetControlsTimeout();
    };

    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('click', handleUserInteraction);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up broadcaster connections');
      clearTimeout(controlsTimeout);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      newSocket.close();
      Object.values(peerConnections).forEach(pc => pc.close());
    };
  }, []);

  const onStart = async () => {
    try {
      console.log('Starting broadcast...');
      
      // Request video constraints - matching Angular exactly
      const constraints = {
        video: { facingMode: 'user' },
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Got media stream:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });
      
      if (remoteVideoRef.current) {
        // Assign stream to video element - exactly like Angular
        remoteVideoRef.current.srcObject = stream;
        
        // Play the video - matching Angular approach
        try {
          await remoteVideoRef.current.play();
          console.log('Video playback started');
        } catch (playError) {
          console.warn('Autoplay failed, but stream is ready:', playError);
        }
      }
      
      setIsStreaming(true);
      setIsCameraOn(true);
      setIsMicOn(true);
      
      console.log('Broadcast started successfully');
    } catch (error) {
      console.error('Error starting broadcast:', error);
      alert('Failed to start broadcast. Please check camera/microphone permissions.');
    }
  };

  const onStop = () => {
    console.log('Stopping broadcast...');
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.pause();
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      if (stream) {
        // Stop all tracks - matching Angular
        stream.getTracks().forEach(track => {
          console.log(`Stopping ${track.kind} track`);
          track.stop();
        });
      }
      remoteVideoRef.current.srcObject = null;
    }
    
    // Close all peer connections
    Object.entries(peerConnections).forEach(([id, pc]) => {
      console.log('Closing peer connection:', id);
      pc.close();
    });
    setPeerConnections({});
    
    setIsStreaming(false);
    setIsCameraOn(false);
    setIsMicOn(false);
    setViewerCount(0);
    
    console.log('Broadcast stopped');
  };

  const toggleCamera = () => {
    if (remoteVideoRef.current?.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        console.log(`Camera ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const toggleMic = () => {
    if (remoteVideoRef.current?.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        console.log(`Microphone ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Navigation */}
      <div className="h-12 sm:h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-3 sm:px-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <span className="text-white font-bold text-base sm:text-lg">Live streaming</span>
          </div>
          
          <span className="text-gray-400 text-sm hidden sm:block">Creator Dashboard</span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {isStreaming && (
            <div className="flex items-center space-x-1 sm:space-x-2 bg-red-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">LIVE</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1 text-gray-400 text-sm">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{viewerCount}</span>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
          >
            {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)] relative">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 bg-black relative">
            <video
              ref={remoteVideoRef}
              className="w-full h-[94vh] object-cover"
              controls={false}
              autoPlay
              muted
              playsInline
            />
            
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 p-4">
                <div className="text-center max-w-sm">
                  <Video className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg sm:text-xl">Camera Off</p>
                  <p className="text-gray-500 text-sm">Click "Start Stream" to begin broadcasting</p>
                </div>
              </div>
            )}

            {/* Stream Controls Overlay */}
            <div className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="bg-black bg-opacity-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                      onClick={toggleCamera}
                      disabled={!isStreaming}
                      className={`p-2 sm:p-3 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                        isCameraOn 
                          ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      } ${!isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isCameraOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    
                    <button
                      onClick={toggleMic}
                      disabled={!isStreaming}
                      className={`p-2 sm:p-3 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                        isMicOn 
                          ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      } ${!isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isMicOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    
                    <button className="p-2 sm:p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {!isStreaming ? (
                      <button
                        onClick={onStart}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[44px]"
                      >
                        Start Stream
                      </button>
                    ) : (
                      <button
                        onClick={onStop}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[44px]"
                      >
                        End Stream
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stream Status Indicators */}
            {isStreaming && (
              <>
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex items-center space-x-1 sm:space-x-2 bg-red-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="font-medium">BROADCASTING</span>
                </div>
                
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-black bg-opacity-70 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm">
                  {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}
                </div>
              </>
            )}

            {/* Mobile Tap to Show Controls */}
            {!showControls && (
              <div className="absolute inset-0 flex items-center justify-center md:hidden">
                <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
                  Tap to show controls
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-80 bg-gray-900 border-l border-gray-800 flex-col">
          <SidebarContent 
            streamTitle={streamTitle}
            setStreamTitle={setStreamTitle}
            streamCategory={streamCategory}
            setStreamCategory={setStreamCategory}
            viewerCount={viewerCount}
            isStreaming={isStreaming}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            peerConnections={peerConnections}
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
              {/* Mobile Header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-semibold">Stream Settings</h2>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SidebarContent 
                streamTitle={streamTitle}
                setStreamTitle={setStreamTitle}
                streamCategory={streamCategory}
                setStreamCategory={setStreamCategory}
                viewerCount={viewerCount}
                isStreaming={isStreaming}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                peerConnections={peerConnections}
                isMobile={true}
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
  streamTitle: string;
  setStreamTitle: (title: string) => void;
  streamCategory: string;
  setStreamCategory: (category: string) => void;
  viewerCount: number;
  isStreaming: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  peerConnections: { [key: string]: RTCPeerConnection };
  isMobile?: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  streamTitle,
  setStreamTitle,
  streamCategory,
  setStreamCategory,
  viewerCount,
  isStreaming,
  isCameraOn,
  isMicOn,
  peerConnections,
  isMobile = false
}) => {
  return (
    <>
      {/* Stream Settings */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-semibold mb-4">Stream Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stream Title
            </label>
            <input
              type="text"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm min-h-[44px]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={streamCategory}
              onChange={(e) => setStreamCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm min-h-[44px]"
            >
              <option value="Just Chatting">Just Chatting</option>
              <option value="Gaming">Gaming</option>
              <option value="Music">Music</option>
              <option value="Art">Art</option>
              <option value="Technology">Technology</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stream Stats */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-semibold mb-4">Stream Stats</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-white font-bold text-lg">{viewerCount}</div>
            <div className="text-gray-400 text-xs">Viewers</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <MessageCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-white font-bold text-lg">0</div>
            <div className="text-gray-400 text-xs">Messages</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Eye className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-white font-bold text-lg">
              {isStreaming ? '00:00' : '--:--'}
            </div>
            <div className="text-gray-400 text-xs">Duration</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Video className="w-4 h-4 text-red-400" />
            </div>
            <div className={`font-bold text-lg ${isCameraOn ? 'text-green-400' : 'text-red-400'}`}>
              {isCameraOn ? 'ON' : 'OFF'}
            </div>
            <div className="text-gray-400 text-xs">Camera</div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-semibold mb-4">Connection Status</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Broadcast Status</span>
            <span className={`text-sm font-medium ${isStreaming ? 'text-green-400' : 'text-gray-400'}`}>
              {isStreaming ? 'Live' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Connected Viewers</span>
            <span className="text-white font-medium">{Object.keys(peerConnections).length}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Microphone</span>
            <span className={`text-sm font-medium ${isMicOn ? 'text-green-400' : 'text-red-400'}`}>
              {isMicOn ? 'On' : 'Off'}
            </span>
          </div>
          
          {!isMobile && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Broadcaster ID</span>
              <span className="text-gray-400 text-xs font-mono">lmVkQphpVgIdLNK7AABF</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-1 p-4">
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        
        <div className="space-y-3">
          <button 
            disabled={!isStreaming}
            className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left min-h-[44px] flex items-center"
          >
            Share Stream Link
          </button>
          <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left min-h-[44px] flex items-center">
            Stream Settings
          </button>
          <button 
            disabled={!isStreaming}
            className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left min-h-[44px] flex items-center"
          >
            Moderation Tools
          </button>
        </div>
      </div>
    </>
  );
};

export default BroadcastPage;