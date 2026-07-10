import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Loader, Globe, Users, Plus, X, Award } from 'lucide-react';

const Pages = () => {
  const { user } = useAuth();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPage, setNewPage] = useState({ name: '', description: '', category: 'Church', website: '' });

  const fetchPages = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/pages');
      setPages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching pages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPages(); }, []);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch('/pages', {
        method: 'POST',
        body: JSON.stringify({ ...newPage, isVerified: true }) // Admins create verified pages by default
      });
      setIsModalOpen(false);
      setNewPage({ name: '', description: '', category: 'Church', website: '' });
      fetchPages();
    } catch (err) {
      alert("Failed to create official page.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollow = async (id: string) => {
    try {
      await apiFetch(`/pages/${id}/follow`, { method: 'POST' });
      fetchPages();
    } catch (err) {
      console.error("Follow error", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pt-10 px-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Official Entities</h1>
          <p className="text-gray-500 font-bold mt-1">Verified churches and ministries across the network.</p>
        </div>
        
        {/* ONLY VISIBLE TO SUPERUSER/ADMIN */}
        {user?.isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-600 transition flex items-center gap-2 shadow-xl shadow-gray-200"
          >
            <Award size={20} className="text-yellow-400" /> Verify New Page
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pages.map((page) => (
            <div key={page._id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:shadow-md transition">
              <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex-shrink-0 border-4 border-white shadow-inner flex items-center justify-center text-blue-300">
                <Globe size={40} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-black text-gray-900">{page.name}</h3>
                  {page.isVerified && <CheckCircle size={18} className="text-blue-500 fill-blue-50" />}
                </div>
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">{page.category}</p>
                
                <div className="flex items-center gap-4 text-gray-500 mb-4">
                  <span className="text-xs font-bold flex items-center gap-1.5"><Users size={14} /> {page.followers?.length || 0} Followers</span>
                </div>

                <button 
                  onClick={() => handleFollow(page._id)}
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                    page.followers?.includes(user?._id) 
                    ? 'bg-gray-100 text-gray-400' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {page.followers?.includes(user?._id) ? 'Following' : 'Follow Page'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADMIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">Verify Entity</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>
            <form onSubmit={handleCreatePage} className="space-y-4">
              <input 
                required 
                placeholder="Organization Name" 
                className="w-full bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-blue-500"
                value={newPage.name}
                onChange={e => setNewPage({...newPage, name: e.target.value})}
              />
              <select 
                className="w-full bg-gray-50 rounded-2xl p-4 font-bold outline-none"
                value={newPage.category}
                onChange={e => setNewPage({...newPage, category: e.target.value})}
              >
                <option>Church</option>
                <option>Ministry</option>
                <option>School</option>
                <option>Conference</option>
              </select>
              <button 
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader className="animate-spin" /> : 'Publish Verified Page'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pages;
