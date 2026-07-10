import React from 'react';
import { Church, Bell } from 'lucide-react';

const SanctuaryFeed = () => {
  return (
    <div className="flex-1 max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sanctuary Feed</h1>
          <p className="text-gray-500 text-sm font-medium">Official updates from the conference and local elders.</p>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <Church size={24} />
        </div>
      </div>

      {/* This is where you would map through official church posts only */}
      <div className="bg-blue-50 border border-blue-100 rounded-[32px] p-8 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Bell className="text-blue-600" />
        </div>
        <h3 className="font-black text-gray-800">No Official Announcements</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
          All quiet on the sanctuary front. Check back for sermon notes and church bulletins.
        </p>
      </div>
    </div>
  );
};

export default SanctuaryFeed;
