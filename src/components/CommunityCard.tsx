import React from 'react';
import { Users, ShieldCheck, ArrowRight } from 'lucide-react';

interface CommunityProps {
  title: string;
  category: string;
  members: number;
  image: string;
  isVerified?: boolean;
}

const CommunityCard = ({ title, category, members, image, isVerified }: CommunityProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
    <div className="h-32 bg-gray-200 relative">
      <img src={image} alt={title} className="w-full h-full object-cover" />
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-blue-600">
        {category}
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-center gap-1">
        <h3 className="font-bold text-gray-900 truncate">{title}</h3>
        {isVerified && <ShieldCheck size={16} className="text-blue-500" />}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
        <Users size={14} />
        <span>{members.toLocaleString()} members</span>
      </div>
      <button className="w-full mt-4 bg-gray-50 text-blue-600 font-semibold py-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
        Join Group <ArrowRight size={16} />
      </button>
    </div>
  </div>
);

export default CommunityCard;
