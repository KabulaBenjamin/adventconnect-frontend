import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, FileText, Activity, Flag, Search, Settings as SettingsIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('https://adventconnect-7jfq.onrender.com/admin/stats', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(setStats)
    .catch(err => console.error("Admin Fetch Error:", err));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0F172A]"> {/* Darker Navy for Admin Mode */}
      <Sidebar />
      
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Header with Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <ShieldCheck className="text-blue-400" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">SuperUser Panel</h1>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Platform Oversight</p>
              </div>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text"
                placeholder="Search users or logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <AdminStat icon={<Users className="text-blue-400" />} label="Members" value={stats?.userCount || 0} />
            <AdminStat icon={<FileText className="text-emerald-400" />} label="Posts" value={stats?.postCount || 0} />
            <AdminStat icon={<Activity className="text-purple-400" />} label="Prayers" value={stats?.prayerCount || 0} />
            <AdminStat icon={<Flag className="text-orange-400" />} label="Ministries" value={stats?.pageCount || 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div className="bg-white/5 rounded-[40px] p-8 border border-white/10">
              <h2 className="text-white font-black text-lg mb-6 flex items-center gap-2">
                <SettingsIcon size={20} className="text-gray-400" /> Administrative Actions
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <ActionButton label="Manage User Reports" color="blue" />
                <ActionButton label="Update Daily Devotion" color="emerald" />
                <ActionButton label="Verify Ministry Pages" color="purple" />
                <ActionButton label="System Health Logs" color="red" />
              </div>
            </div>

            {/* Platform Health / Placeholder for more stats */}
            <div className="bg-gradient-to-br from-blue-600/20 to-transparent rounded-[40px] p-8 border border-blue-500/10 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <Activity className="text-blue-400 animate-pulse" />
              </div>
              <h3 className="text-white font-black">System Live</h3>
              <p className="text-gray-500 text-sm mt-2 max-w-[200px]">All sanctuary services are running normally.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const AdminStat = ({ icon, label, value }: any) => (
  <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 hover:border-white/20 transition-all">
    <div className="mb-4">{icon}</div>
    <div className="text-3xl font-black text-white">{value}</div>
    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</div>
  </div>
);

const ActionButton = ({ label, color }: any) => {
  const colors: any = {
    blue: "hover:bg-blue-500/10 hover:text-blue-400 border-blue-500/10",
    emerald: "hover:bg-emerald-500/10 hover:text-emerald-400 border-emerald-500/10",
    purple: "hover:bg-purple-500/10 hover:text-purple-400 border-purple-500/10",
    red: "hover:bg-red-500/10 hover:text-red-400 border-red-500/10"
  };
  return (
    <button className={`w-full text-left p-4 rounded-2xl border text-gray-400 font-bold transition-all ${colors[color]}`}>
      {label}
    </button>
  );
};

export default AdminDashboard;
