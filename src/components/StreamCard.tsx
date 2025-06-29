import React from 'react';
import { Eye } from 'lucide-react';

interface StreamCardProps {
  streamer: string;
  game: string;
  title: string;
  viewers: number;
  thumbnail: string;
  isLive: boolean;
  category: string;
  onClick?: () => void;
}

const StreamCard: React.FC<StreamCardProps> = ({
  streamer,
  game,
  title,
  viewers,
  thumbnail,
  isLive,
  category,
  onClick
}) => {
  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative overflow-hidden rounded-md bg-gray-800 aspect-video mb-2">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Live indicator */}
        {isLive && (
          <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-600 text-white px-1.5 py-0.5 rounded text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        )}

        {/* Viewer count */}
        <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black bg-opacity-70 text-white px-1.5 py-0.5 rounded text-xs">
          <Eye className="w-3 h-3" />
          <span>{viewers > 1000 ? `${(viewers / 1000).toFixed(1)}K` : viewers.toString()}</span>
        </div>

        {/* Category tag */}
        <div className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-90 text-white px-1.5 py-0.5 rounded text-xs">
          {category}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
      </div>

      {/* Stream info */}
      <div className="space-y-1">
        <div className="flex items-start space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
            {streamer.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-purple-400 transition-colors duration-200 leading-tight">
              {title}
            </h3>
            <p className="text-gray-400 text-sm mt-1 truncate">{streamer}</p>
            <p className="text-gray-500 text-sm truncate">{game}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamCard;