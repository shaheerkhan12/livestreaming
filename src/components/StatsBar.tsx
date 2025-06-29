import React from 'react';
import { TrendingUp, Users, Eye, Heart } from 'lucide-react';

const StatsBar: React.FC = () => {
  const stats = [
    { label: 'Total Viewers', value: '12.4K', icon: Eye, color: 'text-blue-400' },
    { label: 'Followers', value: '8.2K', icon: Users, color: 'text-green-400' },
    { label: 'Live Streams', value: '847', icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Favorites', value: '3.1K', icon: Heart, color: 'text-pink-400' },
  ];

  return (
    <div className="bg-gray-900 border-b border-gray-800 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-white text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsBar;