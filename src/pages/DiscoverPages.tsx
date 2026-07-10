import React from 'react';
import CommunityCard from '../components/CommunityCard';

const DiscoverPages = () => {
  const pages = [
    { 
      title: "Daily Manna", 
      category: "Devotional", 
      members: 45000, 
      image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400", 
      isVerified: true 
    },
    { 
      title: "Adventist World", 
      category: "News", 
      members: 120000, 
      image: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400", 
      isVerified: true 
    },
    { 
      title: "Health & Hope", 
      category: "Lifestyle", 
      members: 15000, 
      image: "https://images.unsplash.com/photo-1505751172107-573957a24840?w=400" 
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Official Pages</h1>
        <p className="text-gray-600 mt-2">Follow ministries, churches, and organizations to stay updated.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pages.map((page, i) => (
          <CommunityCard key={i} {...page} />
        ))}
      </div>
    </div>
  );
};

export default DiscoverPages;
