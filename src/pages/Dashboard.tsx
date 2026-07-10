import React from 'react';

const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-blue-600">Dashboard</h1>
    <p className="mt-4 text-gray-600 font-medium">Welcome to AdventConnect, Benjamin!</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="p-6 bg-white shadow rounded-xl border-l-4 border-blue-500">
        <h3 className="text-sm uppercase text-gray-500">Upcoming Events</h3>
        <p className="text-2xl font-bold">0</p>
      </div>
      <div className="p-6 bg-white shadow rounded-xl border-l-4 border-green-500">
        <h3 className="text-sm uppercase text-gray-500">New Connections</h3>
        <p className="text-2xl font-bold">12</p>
      </div>
    </div>
  </div>
);

export default Dashboard;
