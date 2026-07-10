import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import {
  User, CreditCard, Shield, Users, HelpCircle, Eye, Heart, Bell,
  Accessibility, Layout, Globe, Film, Clock, Moon, Camera,
  Lock, FileText, Search, UserCheck, MessageSquare, StickyNote, Play,
  Ban, ShieldAlert, ChevronRight, Save, CheckCircle, Loader, Settings as SettingsIcon, Church, Compass, X, Sun, ArrowRight, MapPin
} from 'lucide-react';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, title, description, badge, onClick, rightElement }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors"
  >
    <div className="flex items-center gap-4 flex-1">
      <div className="text-slate-700 dark:text-slate-300 min-w-[20px]">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          {badge}
        </div>
        {description && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-md">{description}</p>}
      </div>
    </div>
    {rightElement ? rightElement : <ChevronRight size={14} className="text-gray-400" />}
  </div>
);

interface SettingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, children }) => (
  <div className="border-b border-gray-100 dark:border-slate-800 pb-4 pt-2">
    <div className="flex items-center gap-2 px-1">
      <h3 className="text-xs font-black text-slate-900 dark:text-slate-200">{title}</h3>
    </div>
    {description && <p className="text-[10px] text-gray-400 dark:text-gray-500 px-1 mb-2">{description}</p>}
    <div className="space-y-1 mt-2">{children}</div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [church, setChurch] = useState(user?.localChurch || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Dynamic Component Selection States
  const [activePanelTitle, setActivePanelTitle] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [profileLocked, setProfileLocked] = useState(user?.settings?.isProfileLocked || false);
  const [panelLoading, setPanelLoading] = useState(false);

  // Sync Tailwind Dark Class Strategy
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/users/profile-update', {
        method: 'PUT',
        body: JSON.stringify({ localChurch: church, bio })
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Sanctuary records could not be updated at this time.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProfileLock = async () => {
    setPanelLoading(true);
    try {
      await apiFetch('/users/settings-update', {
        method: 'PUT',
        body: JSON.stringify({ isProfileLocked: !profileLocked })
      });
      setProfileLocked(!profileLocked);
    } catch (err) {
      console.error(err);
    } finally {
      setPanelLoading(false);
    }
  };

  const renderPanelContent = () => {
    switch (activePanelTitle) {
      case "Dark mode":
        return (
          <div className="space-y-4 text-left w-full max-w-sm">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">Activate Night Theme</p>
                <p className="text-[10px] text-gray-400">Reduces glare and screen strain for late night meditation.</p>
              </div>
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full cursor-pointer transition-all ${darkMode ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        );

      case "Profile locking":
        return (
          <div className="space-y-4 text-left w-full max-w-sm">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm text-center space-y-4">
              <Lock size={32} className={`mx-auto ${profileLocked ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Lock Your Adventist Profile</h4>
                <p className="text-[10px] text-gray-400 mt-1">When locked, only confirmed church members can view your musical entries, shared feeds, and spiritual bio details.</p>
              </div>
              <button
                type="button"
                disabled={panelLoading}
                onClick={handleToggleProfileLock}
                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${profileLocked ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}
              >
                {panelLoading ? 'Updating Database...' : profileLocked ? 'Unlock Profile' : 'Lock My Profile Now'}
              </button>
            </div>
          </div>
        );

      case "Privacy Policy":
      case "Cookies Policy":
        return (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 text-left space-y-3 max-w-md">
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">AdventConnect Covenant Principles</h4>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
              We protect all shared digital footprints and sanctuary history records under structural integrity. Your data is never sold or repurposed outside congregational connection logs.
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full mb-3 inline-block">
              <SettingsIcon size={24} className="animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200">Dynamic Control Slot Ready</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-xs mt-1">
              The parameters for <span className="font-bold text-blue-600">"{activePanelTitle}"</span> hook into this single controller without needing extra routes.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 max-w-xl mx-auto py-8 px-4 bg-white dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 font-sans border-x border-gray-100 dark:border-slate-800 shadow-sm relative">

        {/* TOP META BAR SEARCH */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search settings"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 dark:bg-slate-800 border-none outline-none pl-9 pr-4 py-2 text-xs rounded-full focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* ONBOARDING SYNCHRONIZATION ENTRY PANEL */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-black text-xs">
              <MapPin size={14} />
              <span>Profile Synchronization Pipeline</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Did you skip setting up your avatar profile image, GPS location anchors, or contact discovery matches during registration? You can safely re-verify those parameters below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap transition-all shadow-sm shrink-0 cursor-pointer"
          >
            Complete <ArrowRight size={12} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pb-24">

          {/* YOUR ACCOUNT */}
          <SettingSection title="Your account">
            <SettingItem
              icon={<User size={16} />}
              title="Accounts Centre"
              badge={<span className="text-[9px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">Meta Inspired</span>}
              description="Password, security, personal details, connected experiences, verification"
              onClick={() => setActivePanelTitle("Accounts Centre")}
            />
            <SettingItem icon={<CreditCard size={16} />} title="Subscriptions" onClick={() => setActivePanelTitle("Subscriptions")} />
          </SettingSection>

          {/* SPIRITUAL IDENTITY PROFILE FORM WORK */}
          <SettingSection title="Profile Credentials" description="Manage your basic system identifications.">
            <div className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-2xl space-y-3 mt-2">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Brethren Username</label>
                <input type="text" disabled value={user?.username || "Benjamin"} className="w-full mt-1 bg-gray-200/60 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-gray-500 dark:text-gray-400 font-bold text-xs" />
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Spiritual Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full mt-1 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100"
                  placeholder="Tell us about your walk with Christ..."
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Local Congregation</label>
                <div className="relative mt-1">
                  <Church size={12} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={church}
                    onChange={(e) => setChurch(e.target.value)}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl pl-8 pr-3 py-2 text-xs font-medium outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100"
                    placeholder="e.g. Nairobi Central SDA"
                  />
                </div>
              </div>
            </div>
          </SettingSection>

          {/* TOOLS AND RESOURCES */}
          <SettingSection title="Tools and resources" description="Our tools help you control and manage your privacy.">
            <SettingItem icon={<Shield size={16} />} title="Privacy Checkup" onClick={() => setActivePanelTitle("Privacy Checkup")} />
            <SettingItem icon={<Users size={16} />} title="Family Centre" onClick={() => setActivePanelTitle("Family Centre")} />
            <SettingItem icon={<HelpCircle size={16} />} title="Default audience settings" onClick={() => setActivePanelTitle("Default audience settings")} />
          </SettingSection>

          {/* PREFERENCES */}
          <SettingSection title="Preferences" description="Customise your experience on AdventConnect.">
            <SettingItem icon={<Eye size={16} />} title="Content preferences" onClick={() => setActivePanelTitle("Content preferences")} />
            <SettingItem icon={<Heart size={16} />} title="Reaction preferences" onClick={() => setActivePanelTitle("Reaction preferences")} />
            <SettingItem icon={<Bell size={16} />} title="Notifications" onClick={() => setActivePanelTitle("Notifications")} />
            <SettingItem icon={<Accessibility size={16} />} title="Accessibility" onClick={() => setActivePanelTitle("Accessibility")} />
            <SettingItem icon={<Layout size={16} />} title="Tab bar" onClick={() => setActivePanelTitle("Tab bar")} />
            <SettingItem icon={<Globe size={16} />} title="Language and region" onClick={() => setActivePanelTitle("Language and region")} />
            <SettingItem icon={<Film size={16} />} title="Media" onClick={() => setActivePanelTitle("Media")} />
            <SettingItem icon={<Clock size={16} />} title="Time management" onClick={() => setActivePanelTitle("Time management")} />
            <SettingItem icon={<Compass size={16} />} title="Browser" onClick={() => setActivePanelTitle("Browser")} />
            <SettingItem icon={<Moon size={16} />} title="Dark mode" onClick={() => setActivePanelTitle("Dark mode")} />
            <SettingItem icon={<Camera size={16} />} title="Camera roll sharing suggestions" onClick={() => setActivePanelTitle("Camera roll sharing suggestions")} />
          </SettingSection>

          {/* AUDIENCE AND VISIBILITY */}
          <SettingSection title="Audience and visibility" description="Control who can see what you share on AdventConnect.">
            <SettingItem icon={<Lock size={16} />} title="Profile locking" onClick={() => setActivePanelTitle("Profile locking")} />
            <SettingItem icon={<UserCheck size={16} />} title="Profile details" onClick={() => setActivePanelTitle("Profile details")} />
            <SettingItem icon={<MessageSquare size={16} />} title="How people can find and contact you" onClick={() => setActivePanelTitle("How people can find and contact you")} />
            <SettingItem icon={<StickyNote size={16} />} title="Posts" onClick={() => setActivePanelTitle("Posts")} />
            <SettingItem icon={<Play size={16} />} title="Stories" onClick={() => setActivePanelTitle("Stories")} />
            <SettingItem icon={<Film size={16} />} title="Reels" onClick={() => setActivePanelTitle("Reels")} />
            <SettingItem icon={<Users size={16} />} title="Followers and public content" onClick={() => setActivePanelTitle("Followers and public content")} />
            <SettingItem icon={<FileText size={16} />} title="Profile and tagging" onClick={() => setActivePanelTitle("Profile and tagging")} />
            <SettingItem icon={<Ban size={16} />} title="Blocking" onClick={() => setActivePanelTitle("Blocking")} />
            <SettingItem icon={<ShieldAlert size={16} />} title="Active Status" onClick={() => setActivePanelTitle("Active Status")} />
          </SettingSection>

          {/* LEGAL FOOTER LINKS */}
          <div className="pt-4 space-y-2.5 px-1 text-[10px] font-bold text-slate-500 border-t border-gray-100 dark:border-slate-800">
            <div onClick={() => setActivePanelTitle("Privacy Policy")} className="flex items-center gap-3 cursor-pointer hover:underline"><Lock size={12} /> Privacy Policy</div>
            <div onClick={() => setActivePanelTitle("Cookies Policy")} className="flex items-center gap-3 cursor-pointer hover:underline"><Globe size={12} /> Cookies Policy</div>
            <div onClick={() => setActivePanelTitle("Community Standards")} className="flex items-center gap-3 cursor-pointer hover:underline"><Heart size={12} /> Community Standards</div>
            <div onClick={() => setActivePanelTitle("About")} className="flex items-center gap-3 cursor-pointer hover:underline"><HelpCircle size={12} /> About</div>
          </div>

          {/* FLOATING ACTION SAVE FOOTER STRIP */}
          <div className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 p-4 flex items-center justify-between max-w-xl mx-auto px-4 z-40">
            <div className="min-w-[100px]">
              {success && (
                <div className="flex items-center gap-1.5 text-green-600 font-black text-xs animate-bounce">
                  <CheckCircle size={14} /> SAVED CLEAN
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-700 transition-all shadow-md shadow-blue-100 dark:shadow-none active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader className="animate-spin" size={14} /> : <><Save size={14} /> Save Profile</>}
            </button>
          </div>

        </form>

        {/* DYNAMIC INTERACTIVE DETAIL SLIDE OVER OVERLAY */}
        {activePanelTitle && (
          <div className="absolute inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActivePanelTitle(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
              >
                <X size={16} className="text-slate-700 dark:text-slate-300" />
              </button>
              <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">{activePanelTitle}</h2>
            </div>

            <div className="p-6 flex-1 bg-gray-50/50 dark:bg-slate-950/40 overflow-y-auto flex flex-col items-center justify-center">
              {renderPanelContent()}
              {activePanelTitle !== "Dark mode" && activePanelTitle !== "Profile locking" && activePanelTitle !== "Privacy Policy" && activePanelTitle !== "Cookies Policy" && (
                <button
                  type="button"
                  onClick={() => setActivePanelTitle(null)}
                  className="mt-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] uppercase font-black tracking-wider px-4 py-2 rounded-full cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  Return to Directory
                </button>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Settings;
