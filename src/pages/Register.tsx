import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Church, Globe, Shield, Compass, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Step Trackers
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State parameters
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'prefer_not_to_say',
    birthdate: '',
    country: 'Kenya',
    countyOrState: '',
    localChurch: '',
    ministryInterest: 'General Fellow'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.email || !formData.password)) {
      setError('Please complete all required fields.');
      return;
    }
    if (step === 1 && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.localChurch) {
      setError('Please mention your local congregation or type Global Member.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env?.VITE_API_URL || 'https://adventconnect-7jfq.onrender.com/api';
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account.');

      // Fix: Explicitly store token to storage FIRST so global fetch interceptors have it immediately
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Sync state context cleanly
      await login(data.user, data.token);

      // Micro-timeout fallback allows storage changes to settle down across pages
      setTimeout(() => {
        navigate('/onboarding');
      }, 50);

    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Join AdventConnect</h2>
        <p className="mt-1 text-xs text-gray-500">Connecting the global Seventh-day Adventist brethren</p>

        {/* Simple Progress Bar indicator */}
        <div className="mt-4 flex justify-center items-center gap-2 max-w-[160px] mx-auto">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 rounded-3xl space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[11px] font-bold uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* STEP 1: SECURITY DETAILS */}
            {step === 1 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Step 1: Credentials Setup</p>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Brethren Handle / Name</label>
                  <div className="relative mt-1">
                    <User size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Benjamin" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Email Address</label>
                  <div className="relative mt-1">
                    <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="yourname@domain.com" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Secure Password</label>
                  <div className="relative mt-1">
                    <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Confirm Password</label>
                  <div className="relative mt-1">
                    <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                  </div>
                </div>

                <button type="button" onClick={nextStep} className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all">
                  Next parameters <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* STEP 2: DEMOGRAPHICS ONBOARDING */}
            {step === 2 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Step 2: Demographics Information</p>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Gender Identification</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none">
                    <option value="prefer_not_to_say">Prefer Not To Say</option>
                    <option value="male">Brother (Male)</option>
                    <option value="female">Sister (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Date of Birth</label>
                  <div className="relative mt-1">
                    <Calendar size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Country</label>
                  <div className="relative mt-1">
                    <Globe size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">County / State / Region</label>
                  <div className="relative mt-1">
                    <Compass size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input type="text" name="countyOrState" value={formData.countyOrState} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none" placeholder="e.g. Nairobi / Texas" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={prevStep} className="flex-1 bg-gray-100 text-slate-700 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-all">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="button" onClick={nextStep} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all">
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONGREGATION & MINISTRY */}
            {step === 3 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Step 3: Church Connection</p>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Local Congregation Base</label>
                  <div className="relative mt-1">
                    <Church size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input type="text" name="localChurch" required value={formData.localChurch} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Nairobi Central SDA Church" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Primary Ministry Focus / Interest</label>
                  <select name="ministryInterest" value={formData.ministryInterest} onChange={handleChange} className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none">
                    <option value="General Fellow">General Fellow</option>
                    <option value="Choir & Music Ministry">Choir & Music Ministry</option>
                    <option value="Pathfinders / Youth Ministry">Pathfinders / Youth Ministry</option>
                    <option value="Sabbath School Department">Sabbath School Department</option>
                    <option value="Evangelism & Media Production">Evangelism & Media Production</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" disabled={loading} onClick={prevStep} className="flex-1 bg-gray-100 text-slate-700 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-all disabled:opacity-50">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50">
                    {loading ? 'Creating...' : <><Shield size={14} /> Complete Registry</>}
                  </button>
                </div>
              </div>
            )}

          </form>

          <div className="text-center pt-2">
            <p className="text-[11px] text-gray-500">
              Already verified account?{' '}
              <Link to="/login" className="font-black text-blue-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
