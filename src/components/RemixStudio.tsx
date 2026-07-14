import React, { useEffect, useRef, useState } from "react";
import { Video, VideoOff, ArrowLeft, Download, UploadCloud, RefreshCw, Loader2 } from "lucide-react";

interface RemixStudioProps {
  parentChallengeId: string;
  audioUrl: string;
  songTitle: string;
  onClose: () => void;
}

export const RemixStudio: React.FC<RemixStudioProps> = ({ parentChallengeId, audioUrl, songTitle, onClose }) => {
  const [recording, setRecording] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAssetRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!audioUrl || audioUrl.includes("undefined")) {
      alert("Error: Audio layer data could not resolve correctly.");
      onClose();
      return;
    }

    // 1. Prefetch and clear cross-origin parameters for the audio track
    const audio = new Audio();
    audio.crossOrigin = "anonymous"; // 🔥 Matches server CORS access headers
    audio.src = audioUrl;
    audio.load();
    audioAssetRef.current = audio;

    audio.oncanplaythrough = () => {
      setIsAudioLoading(false);
    };

    audio.onerror = (e) => {
      console.error("Audio pipeline asset failed to load:", e);
      setPermissionError("Could not retrieve source audio from server.");
      setIsAudioLoading(false);
    };

    // 2. Request camera & microphone streams
    navigator.mediaDevices.getUserMedia({ 
      video: { width: 720, height: 1280, facingMode: "user" }, 
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
    })
    .then(stream => {
      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    })
    .catch(err => {
      console.error("Hardware permissions rejected:", err);
      setPermissionError(err.name || "Hardware access denied");
    });

    return () => {
      cleanUpStudioMemory();
    };
  }, [audioUrl]);

  const cleanUpStudioMemory = () => {
    if (audioAssetRef.current) {
      audioAssetRef.current.pause();
      audioAssetRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
  };

  const startRemixSession = async () => {
    if (!activeStreamRef.current || !audioAssetRef.current) return;
    setRecordedBlob(null);
    setPreviewUrl(null);
    chunksRef.current = [];

    try {
      // 🎛️ ACCURATE WEB AUDIO MIXING ENGINE
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const audioTrackSource = audioContextRef.current.createMediaElementSource(audioAssetRef.current);
      const micSource = audioContextRef.current.createMediaStreamSource(activeStreamRef.current);
      const mixedAudioDestination = audioContextRef.current.createMediaStreamDestination();

      // Connect backing track and mic to the combined stream recorder
      audioTrackSource.connect(mixedAudioDestination);
      micSource.connect(mixedAudioDestination);
      
      // Route the backing track to system speakers so the user can hear it while singing
      audioTrackSource.connect(audioContextRef.current.destination);

      const compositeStream = new MediaStream();
      compositeStream.addTrack(activeStreamRef.current.getVideoTracks()[0]);
      compositeStream.addTrack(mixedAudioDestination.stream.getAudioTracks()[0]);

      const options = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? { mimeType: "video/webm;codecs=vp9,opus" }
        : { mimeType: "video/webm" };

      const recorder = new MediaRecorder(compositeStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(finalBlob);
        setPreviewUrl(URL.createObjectURL(finalBlob));
      };

      setRecording(true);
      recorder.start();
      
      audioAssetRef.current.currentTime = 0;
      await audioAssetRef.current.play();

    } catch (err) {
      console.error("Mixing context crash details:", err);
      alert("Audio extraction failed. Verify server allows cross-origin requests for static files.");
      setRecording(false);
    }
  };

  const stopRemixSession = () => {
    setRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioAssetRef.current) {
      audioAssetRef.current.pause();
    }
  };

  const handleUploadRemix = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("video", recordedBlob, "remix-submission.webm");
    formData.append("parentChallengeId", parentChallengeId);

    try {
      alert("Remix recorded and successfully prepared with integrated backing track audio!");
      onClose();
    } catch (err) {
      console.error(err);
    } {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-center min-h-screen bg-slate-950 text-white flex flex-col justify-between z-[9999]">
      
      {/* STUDIO HEADER */}
      <div className="flex items-center justify-between w-full border-b border-neutral-900 pb-3">
        <button onClick={onClose} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-black cursor-pointer">
          <ArrowLeft size={14} /> Leave Studio
        </button>
        <div>
          <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Remix Workspace</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Sound layer: <span className="text-white font-bold">{songTitle}</span></p>
        </div>
        <div className="w-10" />
      </div>

      {/* MONITOR ASPECT RATIO CAMERA BLOCK */}
      <div className="relative aspect-[9/16] w-full max-h-[62vh] bg-neutral-900 rounded-[28px] mx-auto overflow-hidden border border-neutral-800 shadow-2xl mt-4 flex items-center justify-center">
        {isAudioLoading ? (
          <div className="text-center p-4 space-y-2 flex flex-col items-center">
            <Loader2 className="animate-spin text-emerald-400" size={24} />
            <p className="text-xs font-bold text-gray-400">Buffering Audio Layer Engine...</p>
          </div>
        ) : permissionError ? (
          <div className="text-center p-4 max-w-xs space-y-2">
            <p className="text-sm font-black text-red-400">⚠️ Studio Blocked</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">{permissionError}</p>
          </div>
        ) : previewUrl ? (
          <div className="absolute inset-0 w-full h-full bg-black z-20">
            <video ref={previewVideoRef} src={previewUrl} autoPlay loop controls className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black">
              REVIEW COMPOSITE MIX
            </div>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100 absolute inset-0" />
        )}
        
        {recording && (
          <div className="absolute top-4 left-4 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1 z-10">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span> REMIX SESSION LIVE
          </div>
        )}
      </div>

      {/* ACTION DASHBOARD PANEL */}
      <div className="my-4 flex flex-col items-center gap-3">
        {previewUrl ? (
          <div className="flex gap-3 w-full max-w-sm justify-center">
            <button onClick={() => { setPreviewUrl(null); setRecordedBlob(null); }} className="bg-neutral-800 text-gray-200 px-5 py-3 rounded-full font-black text-xs flex items-center gap-1.5 hover:bg-neutral-700 cursor-pointer">
              <RefreshCw size={13} /> Retake
            </button>
            <a href={previewUrl} download="my-remix.webm" className="bg-blue-600 text-white px-5 py-3 rounded-full font-black text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-colors">
              <Download size={13} /> Save File
            </a>
            <button onClick={handleUploadRemix} disabled={isUploading} className="bg-emerald-500 text-white px-6 py-3 rounded-full font-black text-xs flex items-center gap-1.5 hover:bg-emerald-600 disabled:opacity-50 cursor-pointer">
              <UploadCloud size={13} /> {isUploading ? "Publishing..." : "Publish Remix"}
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            {!recording ? (
              <button 
                onClick={startRemixSession} 
                disabled={!!permissionError || isAudioLoading} 
                className={`px-8 py-3.5 rounded-full font-black text-xs flex items-center gap-2 shadow-xl transition-all ${
                  permissionError || isAudioLoading 
                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700" 
                    : "bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 cursor-pointer"
                }`}
              >
                Start Session Recording
              </button>
            ) : (
              <button onClick={stopRemixSession} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3.5 rounded-full font-black text-xs flex items-center gap-2 shadow-xl hover:scale-105 transition-transform cursor-pointer">
                Cut & Compile Track
              </button>
            )}
          </div>
        )}
        <p className="text-[10px] text-gray-500 italic max-w-xs leading-relaxed">
          🎧 Pro Tip: Wear headphones to ensure absolute track isolation with no ambient room bleed!
        </p>
      </div>
    </div>
  );
};

export default RemixStudio;