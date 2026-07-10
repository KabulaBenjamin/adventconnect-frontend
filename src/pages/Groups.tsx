import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Users, Plus, X, Loader, Hash, AlertCircle } from 'lucide-react';

const Groups = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', category: 'General' });
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/groups');
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      console.log("Attempting to create group:", newGroup);
      const created = await apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify(newGroup)
      });
      
      console.log("Group created successfully:", created);
      setIsModalOpen(false);
      setNewGroup({ name: '', description: '', category: 'General' });
      fetchGroups(); // Refresh the list
    } catch (err: any) {
      console.error("Creation Error:", err);
      alert("Could not create group: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const joinGroup = (groupId: string) => {
    navigate(`/groups/${groupId}/chat`);
  };

  return (
    <div className="max-w-6xl mx-auto pt-10 px-4 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Communities</h1>
          <p className="text-gray-500 font-bold mt-1">Connect with others in faith-focused circles.</p>
        </div>
        <button 
          onClick={() => {
            console.log("Opening Modal...");
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition flex items-center gap-2 shadow-xl shadow-blue-100 active:scale-95"
        >
          <Plus size={20} /> Create Community
        </button>
      </div>

      {/* Group Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-600" size={32} /></div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
          <Users size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold px-6">No communities found. Be the pioneer and start one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group._id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all group border-b-4 border-b-transparent hover:border-b-blue-600">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Hash size={28} />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{group.category}</p>
              <h3 className="text-xl font-black text-gray-900 mb-2 truncate">{group.name}</h3>
              <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2 h-10">{group.description || "A place for fellowship and growth."}</p>
              <button 
                onClick={() => joinGroup(group._id)}
                className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-black text-sm hover:bg-blue-600 transition shadow-lg shadow-gray-100"
              >
                Join Discussion
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">New Community</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Community Name</label>
                <input 
                  autoFocus
                  required
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 font-bold text-gray-900 focus:bg-white focus:border-blue-500 transition-all outline-none"
                  value={newGroup.name}
                  onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                  placeholder="e.g. Nairobi Youth Choir"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">About the Group</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 font-bold text-gray-900 focus:bg-white focus:border-blue-500 transition-all outline-none resize-none"
                  rows={3}
                  value={newGroup.description}
                  onChange={e => setNewGroup({...newGroup, description: e.target.value})}
                  placeholder="Tell us what this group is for..."
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader className="animate-spin" size={20} /> : 'Launch Community'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
