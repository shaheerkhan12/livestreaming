import React, { useState } from 'react';
import { Search, MoreHorizontal, Video, Eye, Menu, Bell, User } from 'lucide-react';

interface TopBarProps {
  onBroadcast?: () => void;
  onWatcher?: () => void;
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onBroadcast, onWatcher, onMenuClick }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="h-12 sm:h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-3 sm:px-4">
      {/* Left side - Mobile menu + Logo */}
      <div className="flex items-center space-x-3 sm:space-x-6">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm"></div>
          </div>
          <span className="text-white font-bold text-lg xs:hidden">Live streaming</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          <button className="text-purple-400 font-medium text-sm hover:text-purple-300 transition-colors">
            Browse
          </button>
          <button className="text-gray-400 font-medium text-sm hover:text-white transition-colors">
            Esports
          </button>
          <button className="text-gray-400 font-medium text-sm hover:text-white transition-colors">
            Music
          </button>
          <button className="text-gray-400 font-medium text-sm hover:text-white transition-colors">
            More
          </button>
        </nav>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-4 sm:mx-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`
              w-full bg-gray-800 border border-gray-700 rounded-md 
              pl-3 pr-10 py-1.5 sm:py-2
              text-white placeholder-gray-400 
              focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 
              text-sm transition-all duration-200
              ${searchFocused ? 'bg-gray-750' : ''}
            `}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          
          {/* Search suggestions dropdown - mobile friendly */}
          {searchFocused && searchValue && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              <div className="p-2">
                <div className="text-gray-400 text-xs mb-2">Suggestions</div>
                {['Gaming', 'Music', 'Art', 'Just Chatting'].map((suggestion) => (
                  <button
                    key={suggestion}
                    className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded text-sm transition-colors"
                    onClick={() => {
                      setSearchValue(suggestion);
                      setSearchFocused(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Mobile Actions */}
        <div className="flex sm:hidden items-center space-x-2">
          <button 
            onClick={onBroadcast}
            className="p-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Video className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center space-x-3">
          <button 
            onClick={onWatcher}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden md:inline">Watch Live</span>
          </button>
          
          <button 
            onClick={onBroadcast}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <Video className="w-4 h-4" />
            <span className="hidden md:inline">Go Live</span>
          </button>
          
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
            Log In
          </button>
          
          <button className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;