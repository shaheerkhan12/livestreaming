export interface Stream {
  id: string;
  streamer: string;
  game: string;
  title: string;
  viewers: number;
  thumbnail: string;
  isLive: boolean;
  category: string;
}

export const mockStreams: Stream[] = [
  // {
  //   id: '1',
  //   streamer: 'ProGamer_X',
  //   game: 'Valorant',
  //   title: 'Ranked Climb to Radiant - Road to Pro!',
  //   viewers: 15420,
  //   thumbnail: 'https://images.pexels.com/photos/7915439/pexels-photo-7915439.jpeg?auto=compress&cs=tinysrgb&w=400',
  //   isLive: true,
  //   category: 'Gaming'
  // },
  // {
  //   id: '2',
  //   streamer: 'MusicMaster',
  //   game: 'Music Production',
  //   title: 'Creating Beats Live - Lo-Fi Hip Hop Session',
  //   viewers: 8934,
  //   thumbnail: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=400',
  //   isLive: true,
  //   category: 'Music'
  // },
  // {
  //   id: '3',
  //   streamer: 'ArtisticSoul',
  //   game: 'Digital Art',
  //   title: 'Portrait Drawing Tutorial - Character Design',
  //   viewers: 3247,
  //   thumbnail: 'https://images.pexels.com/photos/1145434/pexels-photo-1145434.jpeg?auto=compress&cs=tinysrgb&w=400',
  //   isLive: true,
  //   category: 'Art'
  // },
  // {
  //   id: '4',
  //   streamer: 'SpeedRunner99',
  //   game: 'Super Mario Bros',
  //   title: 'World Record Attempt - Any% Speedrun',
  //   viewers: 22105,
  //   thumbnail: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400',
  //   isLive: true,
  //   category: 'Gaming'
  // },
  // {
  //   id: '5',
  //   streamer: 'CookingChef',
  //   game: 'Cooking',
  //   title: 'Making Italian Pasta from Scratch',
  //   viewers: 5678,
  //   thumbnail: 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=400',
  //   isLive: true,
  //   category: 'Lifestyle'
  // },
  // {
  //   id: '6',
  //   streamer: 'FitnessGuru',
  //   game: 'Fitness',
  //   title: 'Morning Workout - HIIT Training Session',
  //   viewers: 4521,
  //   thumbnail: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=400',
  //   isLive: false,
  //   category: 'Fitness'
  // },
  // {
  //   id: '7',
  //   streamer: 'TechReviewer',
  //   game: 'Technology',
  //   title: 'Latest Gaming Hardware Review & Unboxing',
  //   viewers: 7832,
  //   thumbnail: 'https://images.pexels.com/photos/2148217/pexels-photo-2148217.jpeg?auto=compress&cs=tinysrgb&w=400',
  //   isLive: true,
  //   category: 'Tech'
  // },
  // {
  //   id: '8',
  //   streamer: 'IndieGameDev',
  //   game: 'Game Development',
  //   title: 'Building My First 2D Platform Game',
  //   viewers: 2156,
  //   thumbnail: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=400',
  //   isLive: true,
  //   category: 'Gaming'
  // }
];