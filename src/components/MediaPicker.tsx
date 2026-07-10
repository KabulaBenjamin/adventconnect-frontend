import React, { useState, useRef } from 'react';
import { Image, Globe, Grid, Camera, X, Search, Loader2 } from 'lucide-react';

interface MediaPickerProps {
  onClose: () => void;
  onSelect: (url: string) => void;
}

const MediaPicker = ({ onClose, onSelect }: MediaPickerProps) => {
  const [mode, setMode] = useState<'menu' | 'search' | 'camera'>('menu');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    setMode('camera');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      onSelect(dataUrl); // Pass base64 to Profile
      stopCamera();
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    onClose();
  };

  // --- SEARCH LOGIC (Unsplash Demo) ---
  const searchPhotos = async () => {
    setLoading(true);
    // Note: In production, use your own Unsplash Access Key
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${query}&client_id=YOUR_UNSPLASH_KEY`);
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">
            {mode === 'menu' ? 'Update Photo' : mode === 'camera' ? 'Take Photo' : 'Search Internet'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
        </div>

        {/* CONTENT MODES */}
        <div className="p-6 min-h-[300px]">
          {mode === 'menu' && (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setMode('search')} className="flex flex-col items-center p-6 bg-blue-50 rounded-2xl hover:bg-blue-100 transition">
                <Globe className="text-blue-600 mb-2" size={32} />
                <span className="font-bold text-sm">Search Web</span>
              </button>
              <button onClick={startCamera} className="flex flex-col items-center p-6 bg-red-50 rounded-2xl hover:bg-red-100 transition">
                <Camera className="text-red-600 mb-2" size={32} />
                <span className="font-bold text-sm">Use Camera</span>
              </button>
            </div>
          )}

          {mode === 'camera' && (
            <div className="flex flex-col items-center">
              <video ref={videoRef} autoPlay className="rounded-2xl bg-black w-full aspect-square object-cover" />
              <button onClick={capturePhoto} className="mt-6 bg-red-600 text-white p-6 rounded-full hover:scale-110 transition shadow-xl">
                <Camera size={32} />
              </button>
            </div>
          )}

          {mode === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <input 
                  autoFocus
                  className="w-full p-4 bg-gray-100 rounded-2xl pr-12 font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g. Nature, Cross, Bible..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPhotos()}
                />
                <Search className="absolute right-4 top-4 text-gray-400" onClick={searchPhotos} />
              </div>
              <div className="grid grid-cols-3 gap-2 h-64 overflow-y-auto">
                {results.map((img: any) => (
                  <img 
                    key={img.id} 
                    src={img.urls.small} 
                    className="h-24 w-full object-cover rounded-lg cursor-pointer hover:opacity-75 transition"
                    onClick={() => onSelect(img.urls.regular)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPicker;
