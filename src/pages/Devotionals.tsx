import React from 'react';
import SabbathSchoolLesson from '../components/SabbathSchoolLesson';
import { Sparkles } from 'lucide-react';

const Devotionals = () => {
  return (
    <div className="w-full bg-white rounded-[32px] p-6 md:p-8 lg:p-10 border border-gray-100 shadow-sm min-h-[calc(100vh-140px)]">
      <header className="mb-8 border-b border-gray-50 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-orange-500 fill-orange-100" size={28} />
            Daily Devotionals
          </h1>
          <p className="text-gray-400 font-bold text-sm mt-1">Nourish your soul with daily Scripture reading and lesson interactions</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Render the dynamic dynamic lesson reader deck */}
        <SabbathSchoolLesson />
      </div>
    </div>
  );
};

export default Devotionals;
