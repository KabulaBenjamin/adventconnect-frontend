import React from 'react';

const Events = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-blue-600">Explore Events</h1>
    <div className="mt-8 grid grid-cols-1 gap-4">
      <div className="p-10 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-400">No events found in your area yet.</p>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Create First Event</button>
      </div>
    </div>
  </div>
);

export default Events;
