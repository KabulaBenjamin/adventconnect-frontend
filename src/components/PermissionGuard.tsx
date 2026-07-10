import React, { useState, useEffect } from 'react';
import { ShieldCheck, Camera, Mic, Bell, X } from 'lucide-react';

const PermissionGuard = () => {
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState({
    camera: 'prompt',
    microphone: 'prompt',
    notifications: 'prompt'
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const cam = await navigator.permissions.query({ name: 'camera' as any });
      const mic = await navigator.permissions.query({ name: 'microphone' as any });
      const notifications = Notification.permission;

      setStatus({
        camera: cam.state,
        microphone: mic.state,
        notifications: notifications
      });

      // Show modal if anything is denied or prompted
      if (cam.state === 'prompt' || mic.state === 'prompt' || notifications === 'default') {
        setTimeout(() => setShowModal(true), 2000); // Wait 2 seconds for a better UX
      }
    } catch (e) {
      console.log("Permissions API not fully supported in this browser");
    }
  };

  const requestAccess = async (type: 'camera' | 'mic' | 'notifications') => {
    try {
      if (type === 'camera' || type === 'mic') {
        await navigator.mediaDevices.getUserMedia({ 
          video: type === 'camera', 
          audio: type === 'mic' 
        });
      } else if (type === 'notifications') {
        await Notification.requestPermission();
      }
      checkPermissions();
    } catch (err) {
      console.error("Permission denied", err);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={28} />
            </div>
            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">Enhance Your Experience</h3>
          <p className="text-gray-500 font-medium text-sm mb-8 leading-relaxed">
            To use video calls and real-time updates, AdventConnect needs your permission. Your privacy is our priority.
          </p>

          <div className="space-y-3">
            <PermissionItem 
              icon={<Camera size={18} />} 
              label="Camera" 
              desc="Required for high-quality video calls."
              active={status.camera === 'granted'}
              onClick={() => requestAccess('camera')}
            />
            <PermissionItem 
              icon={<Mic size={18} />} 
              label="Microphone" 
              desc="Needed for voice messages and calls."
              active={status.microphone === 'granted'}
              onClick={() => requestAccess('mic')}
            />
            <PermissionItem 
              icon={<Bell size={18} />} 
              label="Notifications" 
              desc="Get alerted when you receive a message."
              active={status.notifications === 'granted'}
              onClick={() => requestAccess('notifications')}
            />
          </div>

          <button 
            onClick={() => setShowModal(false)}
            className="w-full mt-8 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all active:scale-95"
          >
            I'm All Set
          </button>
        </div>
      </div>
    </div>
  );
};

const PermissionItem = ({ icon, label, desc, active, onClick }: any) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl ${active ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400'}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-black text-gray-900 leading-none">{label}</p>
        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tight">{desc}</p>
      </div>
    </div>
    {active ? (
      <div className="text-green-500 bg-green-50 px-3 py-1 rounded-full text-[10px] font-black uppercase">Active</div>
    ) : (
      <button 
        onClick={onClick}
        className="text-blue-600 hover:text-blue-700 text-xs font-black uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-lg transition"
      >
        Allow
      </button>
    )}
  </div>
);

export default PermissionGuard;
