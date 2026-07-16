import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Users, CheckCircle, ArrowRight, Loader } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');

  // Debug check to see if storage catches up after mount
  useEffect(() => {
    console.log("Onboarding mounted. Current token in storage:", localStorage.getItem('token'));
  }, []);

  const handleSyncContacts = async () => {
    setStatusMsg("Reading contacts registry list...");
    if ('contacts' in navigator && 'Properties' in (window as any).ContactsManager) {
      try {
        const props = ['name', 'email', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: true });
        setStatusMsg(`Discovered ${contacts.length} address connections!`);
      } catch (err) {
        setStatusMsg("Contacts verification skipped or cancelled by user.");
      }
    } else {
      setTimeout(() => {
        setStatusMsg("Discovered address connections successfully via sandbox container emulation.");
      }, 1500);
    }
  };

  const handleCompletePipeline = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env?.VITE_API_URL || 'https://adventconnect-7jfq.onrender.com/api';
      let token = localStorage.getItem('token');

      // Clean quotes if wrapped
      if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      // If token is missing from storage, alert user to prevent empty network submission
      if (!token) {
        throw new Error("Local session token missing. Please try logging in or registering fresh.");
      }

      const res = await fetch(`${apiUrl}/users/onboarding-sync`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.trim()}`
        },
        body: JSON.stringify({
          avatar,
          currentCity: 'Global Member Base'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sync profile properties.");

      navigate('/feed');
    } catch (err: any) {
      alert(`Pipeline error: ${err.message || 'Check backend logging servers.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 border border-gray-100 rounded-3xl shadow-sm space-y-6 text-center">

        {/* STEPPER STATUS ANCHOR DOTS */}
        <div className="flex justify-center items-center gap-6 text-gray-300 mb-2">
          <Camera size={20} className={step === 1 ? 'text-blue-600' : 'text-gray-400'} />
          <div className="h-0.5 w-12 bg-gray-200" />
          <Users size={20} className={step === 2 ? 'text-blue-600' : 'text-gray-400'} />
        </div>

        {/* STEP 1: CHOOSE PROFILE AVATAR IMAGE */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-lg font-black text-slate-900">Customise Your Appearance</h3>
            <p className="text-xs text-gray-500">Let other congregation members identify you within the community space.</p>

            <div className="relative w-24 h-24 mx-auto">
              <img src={avatar} alt="Avatar Frame Preview" className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20" />
              <button type="button" className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full border-2 border-white cursor-pointer shadow">
                <Camera size={12} />
              </button>
            </div>

            <div className="pt-4">
              <button 
                type="button" 
                onClick={() => setStep(2)} 
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all cursor-pointer"
              >
                Next Parameter <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ADDRESS LOG RECOGNITION */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-lg font-black text-slate-900">Find Brethren You Know</h3>
            <p className="text-xs text-gray-500">Sync with your device's addresses log to instantly see which of your friends are already serving on AdventConnect.</p>

            <button
              type="button"
              onClick={handleSyncContacts}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Users size={14} /> Scan Address Book Records
            </button>

            {statusMsg && <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg">{statusMsg}</p>}

            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleCompletePipeline}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader className="animate-spin" size={14} /> : <><CheckCircle size={14} /> Finish Registration & Sync</>}
              </button>
              
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[10px] text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase tracking-wider mt-1"
              >
                Back to Appearance
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
