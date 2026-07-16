import React, { useState, useEffect } from 'react';
import { BookOpen, Heart, Share2, Quote, PlusCircle, X } from 'lucide-react';

const Devotion = () => {
  const [devotion, setDevotion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ verse: '', reference: '', reflection: '' });
  const [isAmen, setIsAmen] = useState(false);

  const fetchTodayDevotion = () => {
    fetch('https://adventconnect-7jfq.onrender.com/devotion/today', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setDevotion(data);
        setLoading(false);
      });
  };

  useEffect(() => { fetchTodayDevotion(); }, []);

  const handleAmen = () => {
    setIsAmen(!isAmen);
    // Logic for saving 'Amen' count could be added here
  };

  const handleShare = () => {
    const text = `Today's Word: "${devotion.verse}" - ${devotion.reference}`;
    navigator.clipboard.writeText(text);
    alert("Devotion copied to clipboard! Share the light.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('https://adventconnect-7jfq.onrender.com/devotion', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowForm(false);
      fetchTodayDevotion();
    }
  };

  if (loading) return <div className="p-10 text-center">Loading your daily bread...</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20 relative">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800 flex items-center gap-2">
              <BookOpen className="text-blue-600" /> Devotion
            </h1>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2"
          >
            <PlusCircle size={20} /> Share Word
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-blue-50">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-10 text-white text-center">
            <Quote className="mb-4 opacity-50 mx-auto" size={32} />
            <h2 className="text-2xl font-serif italic mb-4">"{devotion?.verse}"</h2>
            <p className="text-blue-200 font-bold tracking-widest uppercase text-sm">— {devotion?.reference}</p>
          </div>
          
          <div className="p-8">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Today's Reflection</h3>
            <p className="text-gray-600 leading-relaxed text-lg italic">{devotion?.reflection}</p>
            
            <div className="mt-8 flex gap-4 border-t pt-6">
              <button 
                onClick={handleAmen}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition ${isAmen ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}
              >
                <Heart size={20} className={isAmen ? "fill-red-600" : ""} /> Amen
              </button>
              <button 
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-100 transition"
              >
                <Share2 size={20} /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Modal Logic remains the same... */}
        {showForm && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] px-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-black text-xl">Share a Devotion</h2>
                <button onClick={() => setShowForm(false)}><X /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea 
                  required 
                  className="w-full border rounded-xl p-3" 
                  placeholder="Scripture Verse"
                  onChange={e => setFormData({...formData, verse: e.target.value})}
                />
                <input 
                  required 
                  type="text" 
                  className="w-full border rounded-xl p-3" 
                  placeholder="Reference (e.g. John 3:16)"
                  onChange={e => setFormData({...formData, reference: e.target.value})}
                />
                <textarea 
                  required 
                  className="w-full border rounded-xl p-3" 
                  placeholder="Reflection"
                  onChange={e => setFormData({...formData, reflection: e.target.value})}
                />
                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl">Post Today's Word</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Devotion;
